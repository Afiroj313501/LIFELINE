import { Role, User, BloodGroup } from '@prisma/client';
import { prisma } from '../../services/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '../../utils/tokens';
import {
  RegisterInput,
  LoginInput,
  normalizePhone,
  bangladeshPhoneRegex,
} from './auth.validator';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../common/errors';

export interface ClientContext {
  ipAddress?: string;
  deviceInfo?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: Role;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  avatarUrl: string | null;
  bloodGroup?: BloodGroup | null;
  createdAt: Date;
}

export const sanitizeUser = (
  user: User & { donorProfile?: { bloodGroup: BloodGroup } | null }
): SanitizedUser => {
  return {
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    avatarUrl: user.avatarUrl,
    bloodGroup: user.donorProfile?.bloodGroup ?? null,
    createdAt: user.createdAt,
  };
};

export class AuthService {
  /**
   * Register a new user and optional initial donor profile.
   */
  public async register(
    input: RegisterInput,
    client: ClientContext
  ): Promise<{ user: SanitizedUser; tokens: AuthTokens }> {
    // 1. Check for existing email or phone
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { phoneNumber: input.phoneNumber }],
      },
    });

    if (existing) {
      if (existing.email === input.email) {
        throw new ConflictError('An account with this email address already exists');
      }
      throw new ConflictError('An account with this phone number already exists');
    }

    // 2. Hash password
    const passwordHash = await hashPassword(input.password);

    // 3. Create user + donor profile + token + audit in transaction
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const { user } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          phoneNumber: input.phoneNumber,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
          ...(input.role === Role.DONOR && input.donorProfile
            ? {
                donorProfile: {
                  create: {
                    bloodGroup: input.donorProfile.bloodGroup,
                    gender: input.donorProfile.gender,
                    division: input.donorProfile.division,
                    district: input.donorProfile.district,
                    upazila: input.donorProfile.upazila,
                    addressDetails: input.donorProfile.addressDetails,
                    isAvailable: true,
                    hidePhoneNumber: true,
                    hidePreciseLocation: true,
                  },
                },
              }
            : {}),
        },
      });

      // Persist hashed refresh token
      await tx.refreshToken.create({
        data: {
          tokenHash,
          userId: newUser.id,
          expiresAt,
          ipAddress: client.ipAddress,
          deviceInfo: client.deviceInfo,
        },
      });

      // Record audit event
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'AUTH_REGISTER',
          entityType: 'User',
          entityId: newUser.id,
          ipAddress: client.ipAddress,
          userAgent: client.deviceInfo,
        },
      });

      return { user: newUser };
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  /**
   * Log in via Email OR Bangladesh Phone Number.
   */
  public async login(
    input: LoginInput,
    client: ClientContext
  ): Promise<{ user: SanitizedUser; tokens: AuthTokens }> {
    const isPhone = bangladeshPhoneRegex.test(input.identifier);
    const identifier = isPhone
      ? normalizePhone(input.identifier)
      : input.identifier.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: isPhone ? { phoneNumber: identifier } : { email: identifier },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email/phone or password');
    }

    if (user.isDeactivated) {
      throw new UnauthorizedError('This account has been deactivated. Please contact support.');
    }

    const isValidPassword = await comparePassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email/phone or password');
    }

    // Generate tokens
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
          ipAddress: client.ipAddress,
          deviceInfo: client.deviceInfo,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_LOGIN',
          entityType: 'User',
          entityId: user.id,
          ipAddress: client.ipAddress,
          userAgent: client.deviceInfo,
        },
      });
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  /**
   * Rotate a Refresh Token with reuse detection.
   */
  public async refreshToken(
    rawToken: string,
    client: ClientContext
  ): Promise<{ user: SanitizedUser; tokens: AuthTokens }> {
    const tokenHash = hashToken(rawToken);

    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existingToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Reuse Detection: If token is already revoked, potential token theft occurred!
    if (existingToken.isRevoked) {
      // Invalidate all refresh tokens for this user immediately
      await prisma.refreshToken.updateMany({
        where: { userId: existingToken.userId },
        data: { isRevoked: true },
      });

      await prisma.auditLog.create({
        data: {
          userId: existingToken.userId,
          action: 'SECURITY_TOKEN_REUSE_DETECTED',
          entityType: 'RefreshToken',
          entityId: existingToken.id,
          ipAddress: client.ipAddress,
          userAgent: client.deviceInfo,
          details: {
            alert: 'Attempted to use an already-revoked refresh token. All active sessions invalidated.',
          },
        },
      });

      throw new UnauthorizedError('Security alert: session reuse detected. Please log in again.');
    }

    // Check expiration
    if (existingToken.expiresAt < new Date()) {
      await prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedError('Session expired. Please log in again.');
    }

    if (existingToken.user.isDeactivated) {
      throw new UnauthorizedError('This account has been deactivated.');
    }

    // Single-use token rotation: revoke old, create new
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { isRevoked: true },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: existingToken.userId,
          expiresAt: newExpiresAt,
          ipAddress: client.ipAddress,
          deviceInfo: client.deviceInfo,
        },
      }),
    ]);

    const newAccessToken = generateAccessToken({
      userId: existingToken.user.id,
      email: existingToken.user.email,
      role: existingToken.user.role,
    });

    return {
      user: sanitizeUser(existingToken.user),
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken,
      },
    };
  }

  /**
   * Log out and revoke active refresh token session.
   */
  public async logout(rawToken?: string): Promise<void> {
    if (!rawToken) return;

    const tokenHash = hashToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Get current user profile by ID.
   */
  public async getCurrentUser(userId: string): Promise<SanitizedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return sanitizeUser(user);
  }
}

export const authService = new AuthService();

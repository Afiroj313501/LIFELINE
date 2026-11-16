import { Request, Response, NextFunction } from 'express';
import { authService, ClientContext } from './auth.service';
import { sendSuccess } from '../../common/response';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../common/errors';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const getClientContext = (req: Request): ClientContext => {
  return {
    ipAddress:
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.ip ||
      req.socket.remoteAddress,
    deviceInfo: req.headers['user-agent'],
  };
};

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: `${env.API_PREFIX}/auth`,
  });
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: `${env.API_PREFIX}/auth`,
  });
};

export class AuthController {
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = getClientContext(req);
      const { user, tokens } = await authService.register(req.body, client);

      setRefreshTokenCookie(res, tokens.refreshToken);

      sendSuccess(
        res,
        {
          user,
          accessToken: tokens.accessToken,
        },
        'Registration completed successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = getClientContext(req);
      const { user, tokens } = await authService.login(req.body, client);

      setRefreshTokenCookie(res, tokens.refreshToken);

      sendSuccess(
        res,
        {
          user,
          accessToken: tokens.accessToken,
        },
        'Login successful',
        200
      );
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      if (!rawToken) {
        throw new UnauthorizedError('Refresh token is required');
      }

      const client = getClientContext(req);
      const { user, tokens } = await authService.refreshToken(rawToken, client);

      setRefreshTokenCookie(res, tokens.refreshToken);

      sendSuccess(
        res,
        {
          user,
          accessToken: tokens.accessToken,
        },
        'Token refreshed successfully',
        200
      );
    } catch (error) {
      clearRefreshTokenCookie(res);
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      if (rawToken) {
        await authService.logout(rawToken);
      }

      clearRefreshTokenCookie(res);

      sendSuccess(res, null, 'Logged out successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User session not found');
      }

      const user = await authService.getCurrentUser(userId);
      sendSuccess(res, { user }, 'User profile retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();

import { Prisma, RequestStatus, Role, VolunteerProfile } from '@prisma/client';
import { prisma } from '../../services/prisma';
import { NotFoundError, ConflictError } from '../../common/errors';
import { RegisterVolunteerInput, ListVolunteersQuery } from './volunteers.validator';

export class VolunteersService {
  /**
   * Register or update a volunteer profile
   */
  public async registerVolunteer(
    userId: string,
    input: RegisterVolunteerInput
  ): Promise<VolunteerProfile> {
    const existingNid = await prisma.volunteerProfile.findFirst({
      where: {
        nidNumber: input.nidNumber,
        userId: { not: userId },
      },
    });

    if (existingNid) {
      throw new ConflictError('This National ID (NID) is already registered by another volunteer');
    }

    return prisma.$transaction(async (tx) => {
      const profile = await tx.volunteerProfile.upsert({
        where: { userId },
        create: {
          userId,
          division: input.division,
          district: input.district,
          upazila: input.upazila,
          nidNumber: input.nidNumber,
          isVerified: false,
        },
        update: {
          division: input.division,
          district: input.district,
          upazila: input.upazila,
          nidNumber: input.nidNumber,
        },
      });

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user && user.role === Role.DONOR) {
        await tx.user.update({
          where: { id: userId },
          data: { role: Role.VOLUNTEER },
        });
      }

      return profile;
    });
  }

  /**
   * Get volunteer profile by user ID
   */
  public async getMyProfile(userId: string): Promise<VolunteerProfile> {
    const profile = await prisma.volunteerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError('Volunteer profile not found. Please register as a volunteer first.');
    }

    return profile;
  }

  /**
   * Get volunteer field coordination dashboard
   */
  public async getMyDashboard(userId: string) {
    const profile = await this.getMyProfile(userId);

    const [pendingVerificationRequests, activeBroadcasts, districtStats] = await Promise.all([
      // Requests in volunteer's district awaiting physical/phone verification
      prisma.bloodRequest.findMany({
        where: {
          district: { equals: profile.district, mode: 'insensitive' },
          status: { in: [RequestStatus.PENDING, RequestStatus.UNDER_REVIEW] },
        },
        orderBy: { urgencyLevel: 'desc' },
        take: 10,
      }),
      // Active broadcasts currently ongoing in their district
      prisma.bloodRequest.findMany({
        where: {
          district: { equals: profile.district, mode: 'insensitive' },
          status: { in: [RequestStatus.VERIFIED, RequestStatus.BROADCASTING] },
        },
        orderBy: { urgencyLevel: 'desc' },
        take: 10,
      }),
      // District stats: active donor profiles
      prisma.donorProfile.count({
        where: {
          district: { equals: profile.district, mode: 'insensitive' },
          isAvailable: true,
        },
      }),
    ]);

    return {
      volunteer: {
        id: profile.id,
        badgeTitle: profile.badgeTitle,
        isVerified: profile.isVerified,
        tasksCompleted: profile.tasksCompleted,
        area: `${profile.upazila}, ${profile.district}, ${profile.division}`,
      },
      metrics: {
        pendingVerifications: pendingVerificationRequests.length,
        activeBroadcasts: activeBroadcasts.length,
        activeDonorsInDistrict: districtStats,
      },
      pendingVerificationRequests,
      activeBroadcasts,
    };
  }

  /**
   * List verified volunteers for directory or field coordination
   */
  public async listVolunteers(query: ListVolunteersQuery) {
    const { page, limit, division, district, isVerified } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VolunteerProfileWhereInput = {
      ...(division ? { division: { equals: division, mode: 'insensitive' } } : {}),
      ...(district ? { district: { equals: district, mode: 'insensitive' } } : {}),
      ...(isVerified !== undefined ? { isVerified } : {}),
    };

    const [volunteers, total] = await Promise.all([
      prisma.volunteerProfile.findMany({
        where,
        select: {
          id: true,
          badgeTitle: true,
          division: true,
          district: true,
          upazila: true,
          isVerified: true,
          tasksCompleted: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [{ tasksCompleted: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.volunteerProfile.count({ where }),
    ]);

    return {
      volunteers: volunteers.map((v) => ({
        id: v.id,
        displayName: `${v.user.firstName} ${v.user.lastName ? v.user.lastName.charAt(0) + '.' : ''}`.trim(),
        badgeTitle: v.badgeTitle,
        division: v.division,
        district: v.district,
        upazila: v.upazila,
        isVerified: v.isVerified,
        tasksCompleted: v.tasksCompleted,
        avatarUrl: v.user.avatarUrl,
        joinedAt: v.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Admin verification of volunteer credentials
   */
  public async verifyVolunteer(volunteerId: string): Promise<VolunteerProfile> {
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerId },
    });

    if (!volunteer) {
      throw new NotFoundError('Volunteer not found');
    }

    return prisma.volunteerProfile.update({
      where: { id: volunteerId },
      data: {
        isVerified: true,
        badgeTitle: 'Verified Field Coordinator',
      },
    });
  }
}

export const volunteersService = new VolunteersService();

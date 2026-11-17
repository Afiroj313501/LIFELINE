import {
  Organization,
  OrgMemberRole,
  Prisma,
  RequestStatus,
  Role,
} from '@prisma/client';
import { prisma } from '../../services/prisma';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../../common/errors';
import {
  CreateOrganizationInput,
  ListOrganizationsQuery,
  AddMemberInput,
} from './organizations.validator';

export class OrganizationsService {
  /**
   * List organizations with pagination and filters
   */
  public async listOrganizations(query: ListOrganizationsQuery) {
    const { page, limit, type, division, district, isVerified, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {
      ...(type ? { type } : {}),
      ...(division ? { division: { equals: division, mode: 'insensitive' } } : {}),
      ...(district ? { district: { equals: district, mode: 'insensitive' } } : {}),
      ...(isVerified !== undefined ? { isVerified } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { streetAddress: { contains: search, mode: 'insensitive' } },
              { registrationNo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          division: true,
          district: true,
          upazila: true,
          streetAddress: true,
          contactPhone: true,
          contactEmail: true,
          isVerified: true,
          latitude: true,
          longitude: true,
          _count: {
            select: {
              bloodRequests: true,
              members: true,
            },
          },
        },
        orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.organization.count({ where }),
    ]);

    return {
      organizations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single organization details
   */
  public async getOrganizationById(id: string): Promise<Organization> {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bloodRequests: true,
            members: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return organization;
  }

  /**
   * Register a new organization and assign the creator as OWNER
   */
  public async createOrganization(
    userId: string,
    input: CreateOrganizationInput
  ): Promise<Organization> {
    if (input.registrationNo) {
      const existing = await prisma.organization.findUnique({
        where: { registrationNo: input.registrationNo },
      });
      if (existing) {
        throw new ConflictError('An organization with this registration number already exists');
      }
    }

    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.name,
          type: input.type,
          registrationNo: input.registrationNo,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          division: input.division,
          district: input.district,
          upazila: input.upazila,
          streetAddress: input.streetAddress,
          latitude: input.latitude,
          longitude: input.longitude,
          isVerified: false, // Requires admin review
        },
      });

      // Add creator as OWNER
      await tx.organizationMember.create({
        data: {
          userId,
          organizationId: organization.id,
          role: OrgMemberRole.OWNER,
        },
      });

      // Elevate user role to HOSPITAL_STAFF if standard user
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user && user.role !== Role.ADMIN) {
        await tx.user.update({
          where: { id: userId },
          data: { role: Role.HOSPITAL_STAFF },
        });
      }

      return organization;
    });
  }

  /**
   * Get organization staff dashboard metrics
   */
  public async getOrganizationDashboard(orgId: string, userId: string) {
    // Verify membership
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a staff member of this organization');
    }

    const [activeRequests, fulfilledCount, members] = await Promise.all([
      // Active requests at this hospital
      prisma.bloodRequest.findMany({
        where: {
          hospitalName: { contains: membership.organization.name, mode: 'insensitive' },
          status: {
            in: [
              RequestStatus.PENDING,
              RequestStatus.UNDER_REVIEW,
              RequestStatus.VERIFIED,
              RequestStatus.BROADCASTING,
              RequestStatus.DONOR_RESPONDED,
            ],
          },
        },
        orderBy: { urgencyLevel: 'desc' },
        take: 15,
      }),
      // Fulfilled count
      prisma.bloodRequest.count({
        where: {
          hospitalName: { contains: membership.organization.name, mode: 'insensitive' },
          status: RequestStatus.FULFILLED,
        },
      }),
      // Staff roster
      prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      }),
    ]);

    return {
      organization: membership.organization,
      myRole: membership.role,
      metrics: {
        activeRequestsCount: activeRequests.length,
        fulfilledRequestsCount: fulfilledCount,
        staffCount: members.length,
      },
      activeRequests,
      staffRoster: members.map((m) => ({
        memberId: m.id,
        userId: m.user.id,
        name: `${m.user.firstName} ${m.user.lastName}`.trim(),
        email: m.user.email,
        phone: m.user.phoneNumber,
        role: m.role,
        joinedAt: m.createdAt,
      })),
    };
  }

  /**
   * Add a staff member to the organization
   */
  public async addMember(
    orgId: string,
    requesterUserId: string,
    input: AddMemberInput
  ) {
    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: requesterUserId,
          organizationId: orgId,
        },
      },
    });

    if (
      !requesterMembership ||
      (requesterMembership.role !== OrgMemberRole.OWNER &&
        requesterMembership.role !== OrgMemberRole.ADMIN)
    ) {
      throw new ForbiddenError('Only organization owners and admins can invite staff members');
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!targetUser) {
      throw new NotFoundError('No user found with the provided email address');
    }

    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUser.id,
          organizationId: orgId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a member of this organization');
    }

    return prisma.$transaction(async (tx) => {
      const member = await tx.organizationMember.create({
        data: {
          userId: targetUser.id,
          organizationId: orgId,
          role: input.role,
        },
      });

      if (targetUser.role !== Role.ADMIN) {
        await tx.user.update({
          where: { id: targetUser.id },
          data: { role: Role.HOSPITAL_STAFF },
        });
      }

      return member;
    });
  }

  /**
   * Remove a staff member from the organization
   */
  public async removeMember(
    orgId: string,
    requesterUserId: string,
    memberUserId: string
  ): Promise<void> {
    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: requesterUserId,
          organizationId: orgId,
        },
      },
    });

    if (
      !requesterMembership ||
      (requesterMembership.role !== OrgMemberRole.OWNER &&
        requesterMembership.role !== OrgMemberRole.ADMIN)
    ) {
      throw new ForbiddenError('Only organization owners and admins can remove members');
    }

    if (requesterUserId === memberUserId) {
      throw new BadRequestError('You cannot remove yourself from the organization');
    }

    await prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: memberUserId,
          organizationId: orgId,
        },
      },
    });
  }
}

export const organizationsService = new OrganizationsService();

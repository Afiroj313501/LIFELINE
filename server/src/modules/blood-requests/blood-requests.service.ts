import { Prisma, BloodRequest, RequestStatus } from '@prisma/client';
import { prisma } from '../../services/prisma';
import { CreateBloodRequestInput, ListBloodRequestsQueryInput } from './blood-requests.validator';
import { ConflictError, NotFoundError } from '../../common/errors';

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class BloodRequestsService {
  /**
   * Create an emergency blood request with duplicate detection.
   */
  public async createRequest(
    requesterId: string,
    input: CreateBloodRequestInput,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<BloodRequest> {
    // 1. Anti-spam / Duplicate detection: Check for existing active requests for the same patient and hospital in the last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingDuplicate = await prisma.bloodRequest.findFirst({
      where: {
        requesterId,
        patientName: { equals: input.patientName, mode: 'insensitive' },
        hospitalName: { equals: input.hospitalName, mode: 'insensitive' },
        bloodGroup: input.bloodGroup,
        status: {
          in: [
            RequestStatus.PENDING,
            RequestStatus.UNDER_REVIEW,
            RequestStatus.VERIFIED,
            RequestStatus.BROADCASTING,
          ],
        },
        createdAt: { gte: oneDayAgo },
      },
    });

    if (existingDuplicate) {
      throw new ConflictError(
        'A duplicate active blood request already exists for this patient and hospital within the last 24 hours.'
      );
    }

    const requiredDate = new Date(input.requiredByDate);
    // Request window expires 6 hours after requiredByDate
    const expiresAt = new Date(requiredDate.getTime() + 6 * 60 * 60 * 1000);

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.bloodRequest.create({
        data: {
          requesterId,
          patientName: input.patientName,
          patientAge: input.patientAge,
          patientGender: input.patientGender,
          medicalReason: input.medicalReason,
          prescriptionUrl: input.prescriptionUrl,
          bloodGroup: input.bloodGroup,
          unitsNeeded: input.unitsNeeded,
          hospitalName: input.hospitalName,
          hospitalBedNumber: input.hospitalBedNumber,
          organizationId: input.organizationId,
          division: input.division,
          district: input.district,
          upazila: input.upazila,
          latitude: input.latitude,
          longitude: input.longitude,
          urgencyLevel: input.urgencyLevel,
          status: RequestStatus.PENDING,
          requiredByDate: requiredDate,
          expiresAt,
        },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: requesterId,
          action: 'BLOOD_REQUEST_CREATED',
          entityType: 'BloodRequest',
          entityId: created.id,
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent,
        },
      });

      return created;
    });

    return request;
  }

  /**
   * List blood requests with filtering, pagination, and response counts.
   */
  public async listRequests(
    query: ListBloodRequestsQueryInput
  ): Promise<PaginatedResult<BloodRequest & { _count: { donorResponses: number } }>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BloodRequestWhereInput = {};

    if (query.status) {
      where.status = query.status;
    } else {
      // Default to active requests that have not expired
      where.status = {
        in: [
          RequestStatus.PENDING,
          RequestStatus.UNDER_REVIEW,
          RequestStatus.VERIFIED,
          RequestStatus.BROADCASTING,
          RequestStatus.DONOR_RESPONDED,
        ],
      };
      where.expiresAt = { gt: new Date() };
    }

    if (query.bloodGroup) {
      where.bloodGroup = query.bloodGroup;
    }
    if (query.division) {
      where.division = { equals: query.division, mode: 'insensitive' };
    }
    if (query.district) {
      where.district = { equals: query.district, mode: 'insensitive' };
    }
    if (query.upazila) {
      where.upazila = { equals: query.upazila, mode: 'insensitive' };
    }
    if (query.urgencyLevel) {
      where.urgencyLevel = query.urgencyLevel;
    }

    const [total, items] = await Promise.all([
      prisma.bloodRequest.count({ where }),
      prisma.bloodRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              donorResponses: true,
            },
          },
        },
        orderBy: [
          { urgencyLevel: 'desc' },
          { requiredByDate: 'asc' },
        ],
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single blood request details by ID.
   */
  public async getRequestById(requestId: string): Promise<BloodRequest> {
    const request = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
      include: {
        organization: true,
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        donorResponses: {
          select: {
            id: true,
            status: true,
            unitsPledged: true,
            createdAt: true,
            donor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            donorResponses: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Blood request not found');
    }

    return request;
  }
}

export const bloodRequestsService = new BloodRequestsService();

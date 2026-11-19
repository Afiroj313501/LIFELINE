import { RBC_COMPATIBILITY } from '../matching/matching.service';

import { prisma } from '../../services/prisma';
import {
  CreateBloodRequestInput,
  ListBloodRequestsQueryInput,
  RespondToRequestInput,
} from './blood-requests.validator';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../common/errors';

import { RequestStatus, Role } from '@prisma/client';

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Deterministic State Machine Transition Map
 */
export const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.PENDING]: [
    RequestStatus.UNDER_REVIEW,
    RequestStatus.CANCELLED,
    RequestStatus.EXPIRED,
  ],
  [RequestStatus.UNDER_REVIEW]: [
    RequestStatus.VERIFIED,
    RequestStatus.REJECTED,
    RequestStatus.CANCELLED,
    RequestStatus.EXPIRED,
  ],
  [RequestStatus.VERIFIED]: [
    RequestStatus.BROADCASTING,
    RequestStatus.CANCELLED,
    RequestStatus.EXPIRED,
  ],
  [RequestStatus.BROADCASTING]: [
    RequestStatus.DONOR_RESPONDED,
    RequestStatus.CANCELLED,
    RequestStatus.EXPIRED,
  ],
  [RequestStatus.DONOR_RESPONDED]: [
    RequestStatus.FULFILLED,
    RequestStatus.BROADCASTING,
    RequestStatus.CANCELLED,
    RequestStatus.EXPIRED,
  ],
  [RequestStatus.FULFILLED]: [],
  [RequestStatus.REJECTED]: [],
  [RequestStatus.CANCELLED]: [],
  [RequestStatus.EXPIRED]: [],
};

export class BloodRequestsService {
  /**
   * Create an emergency blood request with duplicate detection.
   */
  public async createRequest(
    requesterId: string,
    input: CreateBloodRequestInput,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<BloodRequest> {
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
   * Transition request status along the state machine.
   */
  public async updateRequestStatus(
    requestId: string,
    targetStatus: RequestStatus,
    operator: { userId: string; role: Role },
    reviewNotes?: string,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<BloodRequest> {
    const existing = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new NotFoundError('Blood request not found');
    }

    // 1. Guard: Validate legal state machine transition
    const allowedTargets = ALLOWED_TRANSITIONS[existing.status] || [];
    if (!allowedTargets.includes(targetStatus)) {
      throw new BadRequestError(
        `Illegal status transition from [${existing.status}] to [${targetStatus}].`
      );
    }

    // 2. Guard: Authorization check per target status
    if (targetStatus === RequestStatus.CANCELLED) {
      // Only requester or admin can cancel
      if (existing.requesterId !== operator.userId && operator.role !== Role.ADMIN) {
        throw new ForbiddenError('Only the requester or a platform admin can cancel this request.');
      }
    } else {
      // Operational transitions require ADMIN, HOSPITAL_STAFF, or VOLUNTEER
      const staffRoles: Role[] = [Role.ADMIN, Role.HOSPITAL_STAFF, Role.VOLUNTEER];
      if (!staffRoles.includes(operator.role)) {
        throw new ForbiddenError(
          `Only authorized staff/volunteers can transition request to [${targetStatus}].`
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.BloodRequestUpdateInput = {
        status: targetStatus,
        reviewNotes: reviewNotes || existing.reviewNotes,
      };

      if (targetStatus === RequestStatus.UNDER_REVIEW) {
        updateData.reviewedBy = { connect: { id: operator.userId } };
      }

      if (targetStatus === RequestStatus.VERIFIED) {
        updateData.verifiedAt = new Date();
        updateData.reviewedBy = { connect: { id: operator.userId } };
      }

      if (targetStatus === RequestStatus.FULFILLED) {
        updateData.fulfilledAt = new Date();
      }

      const res = await tx.bloodRequest.update({
        where: { id: requestId },
        data: updateData,
        include: {
          requester: {
            select: { id: true, firstName: true, lastName: true },
          },
          reviewedBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: operator.userId,
          action: 'BLOOD_REQUEST_STATUS_UPDATED',
          entityType: 'BloodRequest',
          entityId: requestId,
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent,
          details: {
            fromStatus: existing.status,
            toStatus: targetStatus,
            reviewNotes,
          },
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Donor pledges/responds to a blood request.
   */
  public async respondToRequest(
    requestId: string,
    donorId: string,
    input: RespondToRequestInput,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<BloodRequest> {
    const request = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
      include: { donorResponses: true },
    });

    if (!request) {
      throw new NotFoundError('Blood request not found');
    }

    // Only allow response if request is active
    const activeAcceptingStatuses: RequestStatus[] = [
      RequestStatus.VERIFIED,
      RequestStatus.BROADCASTING,
      RequestStatus.DONOR_RESPONDED,
    ];

    if (!activeAcceptingStatuses.includes(request.status)) {
      throw new BadRequestError(
        `Cannot respond to request with status [${request.status}]. Only verified emergency requests accept donor responses.`
      );
    }

    if (request.expiresAt < new Date()) {
      throw new BadRequestError('This emergency request has already expired.');
    }

    const donorProfile = await prisma.donorProfile.findUnique({
      where: { userId: donorId },
    });
    if (!donorProfile) {
      throw new BadRequestError('You must register your donor profile before pledging to donate.');
    }
    // Compatibility check
    if (!RBC_COMPATIBILITY[request.bloodGroup].includes(donorProfile.bloodGroup)) {
      throw new BadRequestError('Blood not matched: Your blood group cannot be donated to the requested group.');
    }


    // Upsert response and advance state machine to DONOR_RESPONDED if currently BROADCASTING or VERIFIED
    const updated = await prisma.$transaction(async (tx) => {
      await tx.donorResponse.upsert({
        where: {
          requestId_donorId: {
            requestId,
            donorId,
          },
        },
        create: {
          requestId,
          donorId,
          unitsPledged: input.unitsPledged,
          note: input.note,
          status: DonorResponseStatus.ACCEPTED,
        },
        update: {
          unitsPledged: input.unitsPledged,
          note: input.note,
          status: DonorResponseStatus.ACCEPTED,
        },
      });

      let nextStatus = request.status;
      if (
        request.status === RequestStatus.VERIFIED ||
        request.status === RequestStatus.BROADCASTING
      ) {
        nextStatus = RequestStatus.DONOR_RESPONDED;
      }

      const res = await tx.bloodRequest.update({
        where: { id: requestId },
        data: { status: nextStatus },
        include: {
          donorResponses: {
            include: {
              donor: {
                select: { firstName: true, lastName: true, phoneNumber: true },
              },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: donorId,
          action: 'DONOR_RESPONDED_TO_REQUEST',
          entityType: 'BloodRequest',
          entityId: requestId,
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent,
          details: {
            unitsPledged: input.unitsPledged,
          },
        },
      });

      return res;
    });

    return updated;
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

  /**
   * Retrieve all blood requests created by a specific user.
   */
  public async getMyRequests(requesterId: string): Promise<BloodRequest[]> {
    return prisma.bloodRequest.findMany({
      where: { requesterId },
      include: {
        _count: {
          select: { donorResponses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const bloodRequestsService = new BloodRequestsService();

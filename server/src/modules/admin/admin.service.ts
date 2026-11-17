import {
  Prisma,
  Report,
  ReportStatus,
  RequestStatus,
  Role,
} from '@prisma/client';
import { prisma } from '../../services/prisma';
import { NotFoundError, BadRequestError } from '../../common/errors';
import { auditService } from './audit.service';
import {
  CreateReportInput,
  ListReportsQuery,
  ResolveReportInput,
} from './admin.validator';

export class AdminService {
  /**
   * System-wide health and moderation metrics
   */
  public async getSystemMetrics() {
    const [
      totalUsers,
      totalDonors,
      totalVolunteers,
      totalOrganizations,
      pendingReportsCount,
      fulfilledDonationsCount,
      requestsByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.donorProfile.count(),
      prisma.volunteerProfile.count(),
      prisma.organization.count(),
      prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      prisma.donationRecord.count(),
      prisma.bloodRequest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const statusCounts = requestsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    return {
      users: {
        total: totalUsers,
        donors: totalDonors,
        volunteers: totalVolunteers,
        organizations: totalOrganizations,
      },
      requests: {
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        byStatus: statusCounts,
        fulfilled: fulfilledDonationsCount,
      },
      moderation: {
        pendingReports: pendingReportsCount,
      },
    };
  }

  /**
   * File a community moderation report
   */
  public async createReport(
    reporterId: string,
    input: CreateReportInput,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<Report> {
    if (!input.requestId && !input.targetUserId) {
      throw new BadRequestError('A report must specify either a requestId or a targetUserId');
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        type: input.type,
        requestId: input.requestId ?? null,
        targetUserId: input.targetUserId ?? null,
        reason: input.reason,
        evidenceUrl: input.evidenceUrl ?? null,
        status: ReportStatus.PENDING,
      },
    });

    await auditService.recordAudit({
      userId: reporterId,
      action: 'REPORT_FILED',
      entityType: 'Report',
      entityId: report.id,
      ipAddress: clientInfo?.ipAddress,
      userAgent: clientInfo?.userAgent,
      details: { type: input.type, requestId: input.requestId, targetUserId: input.targetUserId },
    });

    return report;
  }

  /**
   * List reports for admin moderation
   */
  public async listReports(query: ListReportsQuery) {
    const { page, limit, status, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          request: {
            select: {
              id: true,
              patientName: true,
              bloodGroup: true,
              hospitalName: true,
              status: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single report details
   */
  public async getReportById(id: string): Promise<Report> {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
        request: true,
        resolvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return report;
  }

  /**
   * Resolve or dismiss a moderation report
   */
  public async resolveReport(
    adminId: string,
    reportId: string,
    input: ResolveReportInput,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<Report> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update report resolution status
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: {
          status: input.status,
          resolvedById: adminId,
          resolutionNotes: input.resolutionNotes,
          resolvedAt: new Date(),
        },
      });

      // 2. If requested, deactivate fraudulent target user
      if (input.deactivateTargetUser && report.targetUserId) {
        await tx.user.update({
          where: { id: report.targetUserId },
          data: { isDeactivated: true },
        });

        // Revoke all refresh tokens
        await tx.refreshToken.updateMany({
          where: { userId: report.targetUserId, isRevoked: false },
          data: { isRevoked: true },
        });
      }

      // 3. If requested, cancel/reject fraudulent blood request
      if (input.rejectBloodRequest && report.requestId) {
        await tx.bloodRequest.update({
          where: { id: report.requestId },
          data: {
            status: RequestStatus.REJECTED,
            reviewNotes: `Rejected via moderation report: ${input.resolutionNotes}`,
          },
        });
      }

      // 4. Record audit log
      await auditService.recordAudit({
        userId: adminId,
        action: 'REPORT_RESOLVED',
        entityType: 'Report',
        entityId: reportId,
        ipAddress: clientInfo?.ipAddress,
        userAgent: clientInfo?.userAgent,
        details: {
          status: input.status,
          deactivateTargetUser: input.deactivateTargetUser,
          rejectBloodRequest: input.rejectBloodRequest,
          resolutionNotes: input.resolutionNotes,
        },
      });

      return updatedReport;
    });
  }

  /**
   * Deactivate a fraudulent or abusive user account
   */
  public async deactivateUser(
    adminId: string,
    targetUserId: string,
    reason: string,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new BadRequestError('Cannot deactivate an administrative account');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: { isDeactivated: true },
      });

      await tx.refreshToken.updateMany({
        where: { userId: targetUserId, isRevoked: false },
        data: { isRevoked: true },
      });
    });

    await auditService.recordAudit({
      userId: adminId,
      action: 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: targetUserId,
      ipAddress: clientInfo?.ipAddress,
      userAgent: clientInfo?.userAgent,
      details: { reason },
    });

    return { success: true, message: 'User account has been deactivated' };
  }

  /**
   * Reactivate a previously deactivated user account
   */
  public async reactivateUser(
    adminId: string,
    targetUserId: string,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { isDeactivated: false },
    });

    await auditService.recordAudit({
      userId: adminId,
      action: 'USER_REACTIVATED',
      entityType: 'User',
      entityId: targetUserId,
      ipAddress: clientInfo?.ipAddress,
      userAgent: clientInfo?.userAgent,
    });

    return { success: true, message: 'User account has been reactivated' };
  }
}

export const adminService = new AdminService();

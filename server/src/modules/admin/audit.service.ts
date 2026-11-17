import { Prisma } from '@prisma/client';
import { prisma } from '../../services/prisma';
import { ListAuditLogsQuery } from './admin.validator';

export interface RecordAuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Prisma.InputJsonValue;
}

export class AuditService {
  /**
   * Persist a structured audit trail event
   */
  public async recordAudit(params: RecordAuditParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId ?? null,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
          details: params.details ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      // Never crash the primary request path if audit logging fails
      console.error('[AuditService] Failed to record audit log:', error);
    }
  }

  /**
   * List audit logs with pagination and filters
   */
  public async listAuditLogs(query: ListAuditLogsQuery) {
    const { page, limit, action, entityType, userId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
      ...(entityType ? { entityType: { contains: entityType, mode: 'insensitive' } } : {}),
      ...(userId ? { userId } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const auditService = new AuditService();

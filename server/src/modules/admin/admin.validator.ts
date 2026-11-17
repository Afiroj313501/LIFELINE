import { z } from 'zod';
import { ReportType, ReportStatus } from '@prisma/client';

export const createReportSchema = z.object({
  type: z.nativeEnum(ReportType).default(ReportType.OTHER),
  requestId: z.string().uuid().optional().nullable(),
  targetUserId: z.string().uuid().optional().nullable(),
  reason: z.string().min(5).max(1000),
  evidenceUrl: z.string().url().optional().nullable(),
});

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.nativeEnum(ReportStatus).optional(),
  type: z.nativeEnum(ReportType).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum([ReportStatus.RESOLVED, ReportStatus.DISMISSED]),
  resolutionNotes: z.string().min(3).max(1000),
  deactivateTargetUser: z.boolean().optional().default(false),
  rejectBloodRequest: z.boolean().optional().default(false),
});

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const deactivateUserSchema = z.object({
  reason: z.string().min(5).max(500),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>;

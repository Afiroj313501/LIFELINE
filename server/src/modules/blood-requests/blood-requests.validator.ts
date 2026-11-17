import { z } from 'zod';
import { BloodGroup, Gender, UrgencyLevel, RequestStatus } from '@prisma/client';

export const createBloodRequestSchema = z.object({
  patientName: z.string().min(2, 'Patient name is required').max(100).trim(),
  patientAge: z.number().int().min(0).max(130).optional().nullable(),
  patientGender: z.nativeEnum(Gender).optional().nullable(),
  medicalReason: z.string().max(500, 'Medical reason cannot exceed 500 characters').optional().nullable(),
  prescriptionUrl: z.string().url('Must be a valid document URL').optional().nullable(),

  bloodGroup: z.nativeEnum(BloodGroup),
  unitsNeeded: z.number().int().min(1, 'At least 1 unit is required').max(20, 'Maximum 20 units per request'),

  hospitalName: z.string().min(2, 'Hospital name is required').max(150).trim(),
  hospitalBedNumber: z.string().max(50).optional().nullable(),
  organizationId: z.string().uuid().optional().nullable(),

  division: z.string().min(2, 'Division is required').trim(),
  district: z.string().min(2, 'District is required').trim(),
  upazila: z.string().min(2, 'Upazila is required').trim(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),

  urgencyLevel: z.nativeEnum(UrgencyLevel).default(UrgencyLevel.NORMAL),
  requiredByDate: z
    .string()
    .datetime({ message: 'requiredByDate must be a valid ISO datetime string' })
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: 'requiredByDate must be in the future',
    }),
});

export const updateRequestStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus),
  reviewNotes: z.string().max(500, 'Review notes cannot exceed 500 characters').optional(),
});

export const respondToRequestSchema = z.object({
  unitsPledged: z.number().int().min(1, 'At least 1 unit must be pledged').max(5).default(1),
  note: z.string().max(300, 'Note cannot exceed 300 characters').optional(),
});

export const listBloodRequestsQuerySchema = z.object({
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  division: z.string().trim().optional(),
  district: z.string().trim().optional(),
  upazila: z.string().trim().optional(),
  urgencyLevel: z.nativeEnum(UrgencyLevel).optional(),
  status: z.nativeEnum(RequestStatus).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10))) : 10)),
});

export type CreateBloodRequestInput = z.infer<typeof createBloodRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
export type RespondToRequestInput = z.infer<typeof respondToRequestSchema>;
export type ListBloodRequestsQueryInput = z.infer<typeof listBloodRequestsQuerySchema>;

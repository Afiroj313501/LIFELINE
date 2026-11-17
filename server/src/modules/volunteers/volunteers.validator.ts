import { z } from 'zod';

export const registerVolunteerSchema = z.object({
  division: z.string().min(2).max(50),
  district: z.string().min(2).max(50),
  upazila: z.string().min(2).max(50),
  nidNumber: z.string().min(10).max(17).regex(/^\d+$/, 'NID must contain only digits'),
});

export const listVolunteersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  division: z.string().optional(),
  district: z.string().optional(),
  isVerified: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
});

export type RegisterVolunteerInput = z.infer<typeof registerVolunteerSchema>;
export type ListVolunteersQuery = z.infer<typeof listVolunteersQuerySchema>;

import { z } from 'zod';
import { OrganizationType, OrgMemberRole } from '@prisma/client';
import { bangladeshPhoneRegex } from '../auth/auth.validator';

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(150),
  type: z.nativeEnum(OrganizationType).default(OrganizationType.HOSPITAL),
  registrationNo: z.string().min(2).max(100).optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().regex(bangladeshPhoneRegex, 'Must be a valid Bangladesh mobile number'),
  division: z.string().min(2).max(50),
  district: z.string().min(2).max(50),
  upazila: z.string().min(2).max(50),
  streetAddress: z.string().min(5).max(300),
  latitude: z.number().min(20.0).max(27.0).optional().nullable(),
  longitude: z.number().min(88.0).max(93.0).optional().nullable(),
});

export const listOrganizationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.nativeEnum(OrganizationType).optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  isVerified: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  search: z.string().optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrgMemberRole).default(OrgMemberRole.STAFF),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type ListOrganizationsQuery = z.infer<typeof listOrganizationsQuerySchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;

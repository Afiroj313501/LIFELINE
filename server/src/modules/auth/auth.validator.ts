import { z } from 'zod';
import { Role, BloodGroup, Gender } from '@prisma/client';

/**
 * Bangladesh phone number regex covering all licensed operators:
 * Grameenphone (017, 013), Banglalink (019, 014), Robi (018), Airtel (016), Teletalk (015).
 */
export const bangladeshPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;

/**
 * Normalizes phone numbers to standard E.164 format: +8801XXXXXXXXX
 */
export const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+8801')) {
    return cleaned;
  }
  if (cleaned.startsWith('01')) {
    return `+88${cleaned}`;
  }
  return cleaned;
};

export const registerSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  phoneNumber: z
    .string()
    .regex(bangladeshPhoneRegex, 'Must be a valid Bangladesh phone number (e.g. 017XXXXXXXX or +88017XXXXXXXX)')
    .transform(normalizePhone),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .trim(),
  role: z.nativeEnum(Role).default(Role.DONOR),
  
  // Optional initial donor profile data (if registering as a donor)
  donorProfile: z
    .object({
      bloodGroup: z.nativeEnum(BloodGroup),
      gender: z.nativeEnum(Gender).default(Gender.PREFER_NOT_TO_SAY),
      division: z.string().min(2, 'Division is required'),
      district: z.string().min(2, 'District is required'),
      upazila: z.string().min(2, 'Upazila is required'),
      addressDetails: z.string().optional(),
    })
    .optional(),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or phone number is required')
    .trim(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

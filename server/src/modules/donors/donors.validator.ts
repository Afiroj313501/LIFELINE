import { z } from 'zod';
import { BloodGroup, Gender } from '@prisma/client';

export const updateDonorProfileSchema = z.object({
  bloodGroup: z.nativeEnum(BloodGroup),
  gender: z.nativeEnum(Gender).default(Gender.PREFER_NOT_TO_SAY),
  dateOfBirth: z.string().datetime().optional().nullable(),
  
  // Bangladesh Administrative Region
  division: z.string().min(2, 'Division is required').trim(),
  district: z.string().min(2, 'District is required').trim(),
  upazila: z.string().min(2, 'Upazila is required').trim(),
  addressDetails: z.string().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  
  // Medical & History
  lastDonationDate: z.string().datetime().optional().nullable(),
  totalDonations: z.number().int().min(0).default(0),
  weightKg: z.number().min(30).max(300).optional().nullable(),
  
  // Availability & Privacy
  isAvailable: z.boolean().default(true),
  hidePhoneNumber: z.boolean().default(true),
  hidePreciseLocation: z.boolean().default(true),
  allowEmergencyCalls: z.boolean().default(true),
});

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type UpdateDonorProfileInput = z.infer<typeof updateDonorProfileSchema>;
export type ToggleAvailabilityInput = z.infer<typeof toggleAvailabilitySchema>;

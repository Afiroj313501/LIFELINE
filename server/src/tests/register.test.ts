import { describe, it, expect } from 'vitest';
import { registerSchema } from '../modules/auth/auth.validator';
import { BloodGroup, Gender, Role } from '@prisma/client';

describe('Registration Schema Validation', () => {
  it('Validates a complete donor registration payload', () => {
    const validDonorPayload = {
      firstName: 'Shakib',
      lastName: 'Al Hasan',
      email: 'shakib@example.com',
      phoneNumber: '01712345678',
      password: 'StrongPassword1',
      role: Role.DONOR,
      donorProfile: {
        bloodGroup: BloodGroup.O_POSITIVE,
        gender: Gender.MALE,
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Mirpur',
      },
    };

    const parsed = registerSchema.safeParse(validDonorPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phoneNumber).toBe('+8801712345678'); // normalized to E.164
    }
  });

  it('Rejects password without uppercase letter', () => {
    const invalidPasswordPayload = {
      firstName: 'Shakib',
      lastName: 'Al Hasan',
      email: 'shakib@example.com',
      phoneNumber: '01712345678',
      password: 'weakpassword1',
      role: Role.DONOR,
    };

    const parsed = registerSchema.safeParse(invalidPasswordPayload);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message);
      expect(messages).toContain('Password must contain at least one uppercase letter');
    }
  });

  it('Rejects invalid phone number format', () => {
    const invalidPhonePayload = {
      firstName: 'Shakib',
      lastName: 'Al Hasan',
      email: 'shakib@example.com',
      phoneNumber: '01112345678', // invalid operator
      password: 'StrongPassword1',
      role: Role.DONOR,
    };

    const parsed = registerSchema.safeParse(invalidPhonePayload);
    expect(parsed.success).toBe(false);
  });
});

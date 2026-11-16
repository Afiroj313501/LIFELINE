import { DonorProfile, Role } from '@prisma/client';
import { prisma } from '../../services/prisma';
import { UpdateDonorProfileInput } from './donors.validator';
import { NotFoundError } from '../../common/errors';

export const MIN_DONATION_INTERVAL_DAYS = 90;

export interface MedicalEligibility {
  isMedicallyEligible: boolean;
  nextEligibleDate: Date | null;
  daysUntilEligible: number;
  weightQualified: boolean | null;
}

export interface DonorProfileWithEligibility {
  profile: DonorProfile;
  eligibility: MedicalEligibility;
}

/**
 * Calculates medical eligibility based on 90-day minimum donation interval and weight guidelines.
 */
export const calculateMedicalEligibility = (
  lastDonationDate: Date | null,
  weightKg: number | null
): MedicalEligibility => {
  const weightQualified = weightKg !== null ? weightKg >= 45 : null;

  if (!lastDonationDate) {
    return {
      isMedicallyEligible: weightQualified !== false,
      nextEligibleDate: null,
      daysUntilEligible: 0,
      weightQualified,
    };
  }

  const recoveryMs = MIN_DONATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
  const nextEligibleDate = new Date(lastDonationDate.getTime() + recoveryMs);
  const diffMs = nextEligibleDate.getTime() - Date.now();

  if (diffMs <= 0) {
    return {
      isMedicallyEligible: weightQualified !== false,
      nextEligibleDate,
      daysUntilEligible: 0,
      weightQualified,
    };
  }

  const daysUntilEligible = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  return {
    isMedicallyEligible: false,
    nextEligibleDate,
    daysUntilEligible,
    weightQualified,
  };
};

export class DonorsService {
  /**
   * Retrieve a user's donor profile along with computed medical eligibility.
   */
  public async getProfileByUserId(userId: string): Promise<DonorProfileWithEligibility | null> {
    const profile = await prisma.donorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    const eligibility = calculateMedicalEligibility(
      profile.lastDonationDate,
      profile.weightKg
    );

    return {
      profile,
      eligibility,
    };
  }

  /**
   * Create or update a donor profile.
   */
  public async upsertProfile(
    userId: string,
    input: UpdateDonorProfileInput,
    clientInfo?: { ipAddress?: string; userAgent?: string }
  ): Promise<DonorProfileWithEligibility> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const lastDonation = input.lastDonationDate
      ? new Date(input.lastDonationDate)
      : null;
    const dateOfBirth = input.dateOfBirth
      ? new Date(input.dateOfBirth)
      : null;

    const profile = await prisma.$transaction(async (tx) => {
      // If user is currently a regular recipient, upgrade their role capability to DONOR
      if (user.role === Role.RECIPIENT) {
        await tx.user.update({
          where: { id: userId },
          data: { role: Role.DONOR },
        });
      }

      const upserted = await tx.donorProfile.upsert({
        where: { userId },
        create: {
          userId,
          bloodGroup: input.bloodGroup,
          gender: input.gender,
          dateOfBirth,
          division: input.division,
          district: input.district,
          upazila: input.upazila,
          addressDetails: input.addressDetails,
          latitude: input.latitude,
          longitude: input.longitude,
          lastDonationDate: lastDonation,
          totalDonations: input.totalDonations,
          weightKg: input.weightKg,
          isAvailable: input.isAvailable,
          hidePhoneNumber: input.hidePhoneNumber,
          hidePreciseLocation: input.hidePreciseLocation,
          allowEmergencyCalls: input.allowEmergencyCalls,
        },
        update: {
          bloodGroup: input.bloodGroup,
          gender: input.gender,
          dateOfBirth,
          division: input.division,
          district: input.district,
          upazila: input.upazila,
          addressDetails: input.addressDetails,
          latitude: input.latitude,
          longitude: input.longitude,
          lastDonationDate: lastDonation,
          totalDonations: input.totalDonations,
          weightKg: input.weightKg,
          isAvailable: input.isAvailable,
          hidePhoneNumber: input.hidePhoneNumber,
          hidePreciseLocation: input.hidePreciseLocation,
          allowEmergencyCalls: input.allowEmergencyCalls,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DONOR_PROFILE_UPSERTED',
          entityType: 'DonorProfile',
          entityId: upserted.id,
          ipAddress: clientInfo?.ipAddress,
          userAgent: clientInfo?.userAgent,
        },
      });

      return upserted;
    });

    const eligibility = calculateMedicalEligibility(
      profile.lastDonationDate,
      profile.weightKg
    );

    return {
      profile,
      eligibility,
    };
  }

  /**
   * One-click availability toggle.
   */
  public async toggleAvailability(
    userId: string,
    isAvailable: boolean
  ): Promise<DonorProfileWithEligibility> {
    const existing = await prisma.donorProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundError('Donor profile not found. Please create your profile first.');
    }

    const updated = await prisma.donorProfile.update({
      where: { userId },
      data: { isAvailable },
    });

    const eligibility = calculateMedicalEligibility(
      updated.lastDonationDate,
      updated.weightKg
    );

    return {
      profile: updated,
      eligibility,
    };
  }
}

export const donorsService = new DonorsService();

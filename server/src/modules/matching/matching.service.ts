import { BloodGroup, RequestStatus, DonorProfile } from '@prisma/client';
import { prisma } from '../../services/prisma';
import { calculateMedicalEligibility, MedicalEligibility } from '../donors/donors.service';
import { NotFoundError, BadRequestError } from '../../common/errors';

/**
 * Clinically verified Red Blood Cell (RBC) compatibility matrix.
 * Maps each RECIPIENT blood group to the list of COMPATIBLE DONOR blood groups.
 *
 * Source: WHO Blood Safety & Clinical Technology guidelines.
 *
 * IMPORTANT DISCLAIMER: This matrix is used for emergency search and volunteer
 * coordination ONLY. Actual transfusion compatibility must be confirmed by
 * qualified hospital pathologists via laboratory cross-matching.
 */
export const RBC_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  [BloodGroup.O_NEGATIVE]:  [BloodGroup.O_NEGATIVE],
  [BloodGroup.O_POSITIVE]:  [BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE],
  [BloodGroup.A_NEGATIVE]:  [BloodGroup.A_NEGATIVE, BloodGroup.O_NEGATIVE],
  [BloodGroup.A_POSITIVE]:  [BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE],
  [BloodGroup.B_NEGATIVE]:  [BloodGroup.B_NEGATIVE, BloodGroup.O_NEGATIVE],
  [BloodGroup.B_POSITIVE]:  [BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE],
  [BloodGroup.AB_NEGATIVE]: [BloodGroup.AB_NEGATIVE, BloodGroup.A_NEGATIVE, BloodGroup.B_NEGATIVE, BloodGroup.O_NEGATIVE],
  [BloodGroup.AB_POSITIVE]: [
    BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE,
    BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE,
    BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE,
    BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE,
  ],
};

export enum ProximityTier {
  SAME_UPAZILA = 'SAME_UPAZILA',
  SAME_DISTRICT = 'SAME_DISTRICT',
  SAME_DIVISION = 'SAME_DIVISION',
}

export interface MatchedDonor {
  donorProfileId: string;
  displayName: string;
  bloodGroup: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  proximityTier: ProximityTier;
  isAvailable: boolean;
  totalDonations: number;
  avatarUrl: string | null;
  eligibility: MedicalEligibility;
}

export interface MatchingResult {
  requestId: string;
  recipientBloodGroup: BloodGroup;
  compatibleDonorGroups: BloodGroup[];
  totalMatches: number;
  donors: MatchedDonor[];
  disclaimer: string;
}

export class MatchingService {
  /**
   * Find compatible, eligible, geographically ranked donors for a blood request.
   */
  public async findMatchingDonors(requestId: string): Promise<MatchingResult> {
    const request = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Blood request not found');
    }

    // Only match for active requests
    const matchableStatuses: RequestStatus[] = [
      RequestStatus.VERIFIED,
      RequestStatus.BROADCASTING,
      RequestStatus.DONOR_RESPONDED,
    ];

    if (!matchableStatuses.includes(request.status)) {
      throw new BadRequestError(
        `Matching is only available for requests with status: [${matchableStatuses.join(', ')}]. ` +
        `Current status: ${request.status}`
      );
    }

    const compatibleGroups = RBC_COMPATIBILITY[request.bloodGroup];

    // Calculate the 90-day eligibility cutoff date
    const eligibilityCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Query eligible donors: compatible blood group, available, not in recovery, active account
    const eligibleProfiles = await prisma.donorProfile.findMany({
      where: {
        bloodGroup: { in: compatibleGroups },
        isAvailable: true,
        user: { isDeactivated: false },
        // Division-level geographic scope (broadest tier we match)
        division: request.division,
        // 90-day eligibility: either never donated, or last donation was before the cutoff
        OR: [
          { lastDonationDate: null },
          { lastDonationDate: { lte: eligibilityCutoff } },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { totalDonations: 'desc' },
      ],
    });

    // Classify into proximity tiers and build masked results
    const donors: MatchedDonor[] = eligibleProfiles.map((profile) => {
      let proximityTier: ProximityTier;

      if (
        profile.district.toLowerCase() === request.district.toLowerCase() &&
        profile.upazila.toLowerCase() === request.upazila.toLowerCase()
      ) {
        proximityTier = ProximityTier.SAME_UPAZILA;
      } else if (profile.district.toLowerCase() === request.district.toLowerCase()) {
        proximityTier = ProximityTier.SAME_DISTRICT;
      } else {
        proximityTier = ProximityTier.SAME_DIVISION;
      }

      const lastInitial = profile.user.lastName ? `${profile.user.lastName.charAt(0)}.` : '';
      const displayName = `${profile.user.firstName} ${lastInitial}`.trim();

      const eligibility = calculateMedicalEligibility(
        profile.lastDonationDate,
        profile.weightKg
      );

      return {
        donorProfileId: profile.id,
        displayName,
        bloodGroup: profile.bloodGroup,
        division: profile.division,
        district: profile.district,
        upazila: profile.upazila,
        proximityTier,
        isAvailable: profile.isAvailable,
        totalDonations: profile.totalDonations,
        avatarUrl: profile.user.avatarUrl,
        eligibility,
      };
    });

    // Sort by proximity tier priority, then by total donations desc
    const tierPriority: Record<ProximityTier, number> = {
      [ProximityTier.SAME_UPAZILA]: 0,
      [ProximityTier.SAME_DISTRICT]: 1,
      [ProximityTier.SAME_DIVISION]: 2,
    };

    donors.sort((a, b) => {
      const tierDiff = tierPriority[a.proximityTier] - tierPriority[b.proximityTier];
      if (tierDiff !== 0) return tierDiff;
      return b.totalDonations - a.totalDonations;
    });

    return {
      requestId: request.id,
      recipientBloodGroup: request.bloodGroup,
      compatibleDonorGroups: compatibleGroups,
      totalMatches: donors.length,
      donors,
      disclaimer:
        'This matching result is for emergency coordination only. ' +
        'All transfusion decisions must be confirmed by qualified medical professionals ' +
        'through laboratory cross-matching prior to any blood transfusion.',
    };
  }
}

export const matchingService = new MatchingService();

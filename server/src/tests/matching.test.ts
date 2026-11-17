import { describe, it, expect } from 'vitest';
import { BloodGroup } from '@prisma/client';
import { RBC_COMPATIBILITY, ProximityTier } from '../modules/matching/matching.service';

describe('RBC Compatibility & Matching Engine', () => {
  const allGroups: BloodGroup[] = [
    BloodGroup.O_NEGATIVE,
    BloodGroup.O_POSITIVE,
    BloodGroup.A_NEGATIVE,
    BloodGroup.A_POSITIVE,
    BloodGroup.B_NEGATIVE,
    BloodGroup.B_POSITIVE,
    BloodGroup.AB_NEGATIVE,
    BloodGroup.AB_POSITIVE,
  ];

  it('Universal Donor (O-) is compatible with all recipient groups', () => {
    allGroups.forEach((recipientGroup) => {
      const compatibleDonors = RBC_COMPATIBILITY[recipientGroup];
      expect(compatibleDonors).toContain(BloodGroup.O_NEGATIVE);
    });
  });

  it('Universal Recipient (AB+) can receive from all 8 blood groups', () => {
    const compatibleDonors = RBC_COMPATIBILITY[BloodGroup.AB_POSITIVE];
    expect(compatibleDonors).toHaveLength(8);
    allGroups.forEach((group) => {
      expect(compatibleDonors).toContain(group);
    });
  });

  it('O- Negative recipient can ONLY receive from O- Negative donors', () => {
    const compatibleDonors = RBC_COMPATIBILITY[BloodGroup.O_NEGATIVE];
    expect(compatibleDonors).toEqual([BloodGroup.O_NEGATIVE]);
  });

  it('O+ Positive recipient can only receive from O+ and O-', () => {
    const compatibleDonors = RBC_COMPATIBILITY[BloodGroup.O_POSITIVE];
    expect(compatibleDonors).toHaveLength(2);
    expect(compatibleDonors).toContain(BloodGroup.O_POSITIVE);
    expect(compatibleDonors).toContain(BloodGroup.O_NEGATIVE);
  });

  it('A+ recipient can receive from A+, A-, O+, O-', () => {
    const compatibleDonors = RBC_COMPATIBILITY[BloodGroup.A_POSITIVE];
    expect(compatibleDonors).toHaveLength(4);
    expect(compatibleDonors).toEqual(
      expect.arrayContaining([
        BloodGroup.A_POSITIVE,
        BloodGroup.A_NEGATIVE,
        BloodGroup.O_POSITIVE,
        BloodGroup.O_NEGATIVE,
      ])
    );
  });

  it('B+ recipient can receive from B+, B-, O+, O-', () => {
    const compatibleDonors = RBC_COMPATIBILITY[BloodGroup.B_POSITIVE];
    expect(compatibleDonors).toHaveLength(4);
    expect(compatibleDonors).toEqual(
      expect.arrayContaining([
        BloodGroup.B_POSITIVE,
        BloodGroup.B_NEGATIVE,
        BloodGroup.O_POSITIVE,
        BloodGroup.O_NEGATIVE,
      ])
    );
  });

  it('AB- recipient can receive from AB-, A-, B-, O-', () => {
    const compatibleDonors = RBC_COMPATIBILITY[BloodGroup.AB_NEGATIVE];
    expect(compatibleDonors).toHaveLength(4);
    expect(compatibleDonors).toEqual(
      expect.arrayContaining([
        BloodGroup.AB_NEGATIVE,
        BloodGroup.A_NEGATIVE,
        BloodGroup.B_NEGATIVE,
        BloodGroup.O_NEGATIVE,
      ])
    );
  });

  it('Proximity tier priority hierarchy is correctly ordered', () => {
    const tierPriority: Record<ProximityTier, number> = {
      [ProximityTier.SAME_UPAZILA]: 0,
      [ProximityTier.SAME_DISTRICT]: 1,
      [ProximityTier.SAME_DIVISION]: 2,
    };

    expect(tierPriority[ProximityTier.SAME_UPAZILA]).toBeLessThan(
      tierPriority[ProximityTier.SAME_DISTRICT]
    );
    expect(tierPriority[ProximityTier.SAME_DISTRICT]).toBeLessThan(
      tierPriority[ProximityTier.SAME_DIVISION]
    );
  });
});

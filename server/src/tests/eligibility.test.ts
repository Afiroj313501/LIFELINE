import { describe, it, expect } from 'vitest';
import { calculateMedicalEligibility } from '../modules/donors/donors.service';

describe('Medical Eligibility & 90-Day Deferral Interval', () => {
  it('Marks first-time donor (null lastDonationDate) as immediately ELIGIBLE', () => {
    const result = calculateMedicalEligibility(null, 65);
    expect(result.isMedicallyEligible).toBe(true);
    expect(result.daysUntilEligible).toBe(0);
    expect(result.nextEligibleDate).toBeNull();
    expect(result.weightQualified).toBe(true);
  });

  it('Marks donor as ELIGIBLE when last donation was >90 days ago', () => {
    const ninetyFiveDaysAgo = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000);
    const result = calculateMedicalEligibility(ninetyFiveDaysAgo, 70);

    expect(result.isMedicallyEligible).toBe(true);
    expect(result.daysUntilEligible).toBe(0);
    expect(result.weightQualified).toBe(true);
  });

  it('Marks donor as INELIGIBLE when last donation was 45 days ago', () => {
    const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    const result = calculateMedicalEligibility(fortyFiveDaysAgo, 60);

    expect(result.isMedicallyEligible).toBe(false);
    expect(result.daysUntilEligible).toBeGreaterThanOrEqual(44);
    expect(result.daysUntilEligible).toBeLessThanOrEqual(46);
    expect(result.nextEligibleDate).not.toBeNull();
  });

  it('Marks donor as INELIGIBLE when weight is below 45kg threshold', () => {
    const ninetyFiveDaysAgo = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000);
    const result = calculateMedicalEligibility(ninetyFiveDaysAgo, 42);

    expect(result.isMedicallyEligible).toBe(false);
    expect(result.weightQualified).toBe(false);
  });

  it('Marks donor as ELIGIBLE when weight meets threshold (>= 45kg) and interval elapsed', () => {
    const result = calculateMedicalEligibility(null, 45);
    expect(result.isMedicallyEligible).toBe(true);
    expect(result.weightQualified).toBe(true);
  });
});

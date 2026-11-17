import { describe, it, expect } from 'vitest';
import {
  bangladeshPhoneRegex,
  normalizePhone,
} from '../modules/auth/auth.validator';

describe('Bangladesh Phone Regex & E.164 Normalization', () => {
  it('Accepts valid local numbers for all Bangladesh MNOs', () => {
    const validLocalNumbers = [
      '01712345678', // Grameenphone
      '01312345678', // Skitto / GP
      '01812345678', // Robi
      '01612345678', // Airtel / Robi
      '01912345678', // Banglalink
      '01412345678', // Banglalink
      '01512345678', // Teletalk
    ];

    validLocalNumbers.forEach((phone) => {
      expect(bangladeshPhoneRegex.test(phone)).toBe(true);
    });
  });

  it('Accepts valid E.164 international numbers for all Bangladesh MNOs', () => {
    const validIntlNumbers = [
      '+8801712345678',
      '+8801312345678',
      '+8801812345678',
      '+8801912345678',
      '+8801512345678',
    ];

    validIntlNumbers.forEach((phone) => {
      expect(bangladeshPhoneRegex.test(phone)).toBe(true);
    });
  });

  it('Rejects invalid operator prefixes and foreign numbers', () => {
    const invalidNumbers = [
      '01112345678', // Citycell (defunct)
      '01212345678', // Invalid prefix
      '01012345678', // Invalid prefix
      '+12345678901', // US number
      '+919876543210', // Indian number
    ];

    invalidNumbers.forEach((phone) => {
      expect(bangladeshPhoneRegex.test(phone)).toBe(false);
    });
  });

  it('Rejects numbers with wrong digit lengths', () => {
    expect(bangladeshPhoneRegex.test('0171234567')).toBe(false); // 10 digits (too short)
    expect(bangladeshPhoneRegex.test('017123456789')).toBe(false); // 12 digits (too long)
  });

  it('Rejects letters and special characters', () => {
    expect(bangladeshPhoneRegex.test('0171234567a')).toBe(false);
    expect(bangladeshPhoneRegex.test('017-1234-5678')).toBe(false);
  });

  it('Normalizes local numbers to standard E.164 (+8801XXXXXXXXX)', () => {
    expect(normalizePhone('01712345678')).toBe('+8801712345678');
    expect(normalizePhone('01812345678')).toBe('+8801812345678');
    expect(normalizePhone('+8801712345678')).toBe('+8801712345678');
  });
});

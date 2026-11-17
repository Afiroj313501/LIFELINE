import { describe, it, expect } from 'vitest';
import { Role } from '@prisma/client';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
} from '../utils/tokens';
import { hashPassword, comparePassword } from '../utils/password';

describe('Cryptographic Tokens & Password Security', () => {
  it('Generates and verifies a valid JWT access token', () => {
    const payload = {
      userId: 'test-user-id-123',
      email: 'donor@lifeline.org.bd',
      role: Role.DONOR,
    };

    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // Standard JWT header.payload.signature

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('Generates high-entropy 80-character (40-byte) hex refresh tokens', () => {
    const token1 = generateRefreshToken();
    const token2 = generateRefreshToken();

    expect(token1).toHaveLength(80);
    expect(token2).toHaveLength(80);
    expect(token1).not.toBe(token2);
  });

  it('Produces consistent 64-character SHA-256 token hashes', () => {
    const token = 'sample-random-refresh-token-value';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(/^[a-f0-9]{64}$/.test(hash1)).toBe(true);
  });

  it('Hashes and correctly validates passwords with bcrypt', async () => {
    const rawPassword = 'LifeLineSecure@2026';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('WrongPassword123', hash);
    expect(isWrongMatch).toBe(false);
  });
});

import bcrypt from 'bcryptjs';
import { env } from '../config/env';

const SALT_ROUNDS = env.NODE_ENV === 'production' ? 12 : 10;

/**
 * Hash a plain text password with bcrypt.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain text password against a bcrypt hash.
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

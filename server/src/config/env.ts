import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
      message: 'PORT must be a valid port number between 1 and 65535',
    }),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .default('postgresql://lifeline_user:lifeline_secret_2026@localhost:5433/lifeline_db?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters long')
    .default('dev_access_secret_change_in_production_min_32_chars_long'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters long')
    .default('dev_refresh_secret_change_in_production_min_32_chars_long'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;

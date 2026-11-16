import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { prisma } from './services/prisma';
import authRoutes from './modules/auth/auth.routes';
import donorRoutes from './modules/donors/donors.routes';
import { errorHandler } from './middleware/error';

export const createApp = (): express.Application => {
  const app = express();

  // Security HTTP headers
  app.use(helmet());

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Cookie parser for secure HttpOnly refresh token rotation
  app.use(cookieParser());

  // Body parser with 10mb limit for documents / prescriptions
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root health check endpoint with active database probe
  app.get('/health', async (_req: Request, res: Response) => {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    const isHealthy = dbStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      service: 'lifeline-api',
      environment: env.NODE_ENV,
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Base API health check endpoint under API_PREFIX
  app.get(`${env.API_PREFIX}/health`, async (_req: Request, res: Response) => {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    res.status(dbStatus === 'connected' ? 200 : 503).json({
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      service: 'lifeline-api',
      version: '1.0.0',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // Domain API Routes
  app.use(`${env.API_PREFIX}/auth`, authRoutes);
  app.use(`${env.API_PREFIX}/donors`, donorRoutes);

  // 404 handler for unmatched routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: 'The requested resource was not found on this server.',
    });
  });

  // Global centralized error handler
  app.use(errorHandler);

  return app;
};

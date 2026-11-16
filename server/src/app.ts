import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';

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

  // Body parser with 10mb limit for documents / prescriptions
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'lifeline-api',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Base API health check endpoint under API_PREFIX
  app.get(`${env.API_PREFIX}/health`, (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'lifeline-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler for unmatched routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found on this server.',
    });
  });

  return app;
};

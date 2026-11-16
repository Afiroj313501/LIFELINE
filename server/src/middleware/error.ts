import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { sendError } from '../common/response';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(
      res,
      err.message,
      err.statusCode,
      err.constructor.name,
      err.details
    );
    return;
  }

  // Unhandled internal errors
  console.error('Unhandled Application Error:', err);

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  sendError(
    res,
    message,
    500,
    'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'development' ? err.stack : undefined
  );
};

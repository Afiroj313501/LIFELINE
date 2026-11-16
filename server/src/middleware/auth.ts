import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/tokens';
import { UnauthorizedError, ForbiddenError } from '../common/errors';

/**
 * Authentication middleware: verifies Bearer JWT in Authorization header.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or invalid format');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired authentication token'));
    }
  }
};

/**
 * Role-Based Access Control (RBAC) guard: ensures authenticated user has one of the allowed roles.
 */
export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`
        )
      );
      return;
    }

    next();
  };
};

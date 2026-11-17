import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { auditService } from './audit.service';
import { sendSuccess } from '../../common/response';
import { UnauthorizedError, BadRequestError } from '../../common/errors';
import {
  createReportSchema,
  listReportsQuerySchema,
  resolveReportSchema,
  listAuditLogsQuerySchema,
  deactivateUserSchema,
} from './admin.validator';

export class AdminController {
  public getSystemMetrics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const metrics = await adminService.getSystemMetrics();
      sendSuccess(res, metrics, 'System metrics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public createReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reporterId = req.user?.userId;
      if (!reporterId) {
        throw new UnauthorizedError('Authentication required');
      }

      const clientInfo = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const validatedBody = createReportSchema.parse(req.body);
      const result = await adminService.createReport(reporterId, validatedBody, clientInfo);
      sendSuccess(res, result, 'Moderation report submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public listReports = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedQuery = listReportsQuerySchema.parse(req.query);
      const result = await adminService.listReports(validatedQuery);
      sendSuccess(res, result, 'Reports retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public getReportById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Report ID is required');
      }

      const result = await adminService.getReportById(id);
      sendSuccess(res, result, 'Report details retrieved', 200);
    } catch (error) {
      next(error);
    }
  };

  public resolveReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = req.user?.userId;
      if (!adminId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Report ID is required');
      }

      const clientInfo = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const validatedBody = resolveReportSchema.parse(req.body);
      const result = await adminService.resolveReport(adminId, id, validatedBody, clientInfo);
      sendSuccess(res, result, 'Report resolved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public listAuditLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedQuery = listAuditLogsQuerySchema.parse(req.query);
      const result = await auditService.listAuditLogs(validatedQuery);
      sendSuccess(res, result, 'Audit logs retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public deactivateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = req.user?.userId;
      if (!adminId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('User ID is required');
      }

      const clientInfo = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const validatedBody = deactivateUserSchema.parse(req.body);
      const result = await adminService.deactivateUser(adminId, id, validatedBody.reason, clientInfo);
      sendSuccess(res, result, 'User deactivated', 200);
    } catch (error) {
      next(error);
    }
  };

  public reactivateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = req.user?.userId;
      if (!adminId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('User ID is required');
      }

      const clientInfo = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await adminService.reactivateUser(adminId, id, clientInfo);
      sendSuccess(res, result, 'User reactivated', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();

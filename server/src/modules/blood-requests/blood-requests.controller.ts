import { Request, Response, NextFunction } from 'express';
import { bloodRequestsService } from './blood-requests.service';
import { sendSuccess } from '../../common/response';
import { UnauthorizedError } from '../../common/errors';
import {
  listBloodRequestsQuerySchema,
  updateRequestStatusSchema,
  respondToRequestSchema,
} from './blood-requests.validator';

export class BloodRequestsController {
  public createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.user?.userId;
      if (!requesterId) {
        throw new UnauthorizedError('Authentication required');
      }

      const clientInfo = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await bloodRequestsService.createRequest(requesterId, req.body, clientInfo);
      sendSuccess(res, result, 'Emergency blood request created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public listRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = listBloodRequestsQuerySchema.parse(req.query);
      const result = await bloodRequestsService.listRequests(validatedQuery);
      sendSuccess(res, result, 'Blood requests retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public getMyRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await bloodRequestsService.getMyRequests(userId);
      sendSuccess(res, result, 'Your blood requests retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public getRequestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await bloodRequestsService.getRequestById(id);
      sendSuccess(res, result, 'Blood request details retrieved', 200);
    } catch (error) {
      next(error);
    }
  };

  public updateRequestStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      const { status, reviewNotes } = updateRequestStatusSchema.parse(req.body);

      const clientInfo = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await bloodRequestsService.updateRequestStatus(
        id,
        status,
        user,
        reviewNotes,
        clientInfo
      );

      sendSuccess(res, result, `Blood request status updated to ${status}`, 200);
    } catch (error) {
      next(error);
    }
  };

  public respondToRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const donorId = req.user?.userId;
      if (!donorId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      const validatedInput = respondToRequestSchema.parse(req.body);

      const clientInfo = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await bloodRequestsService.respondToRequest(
        id,
        donorId,
        validatedInput,
        clientInfo
      );

      sendSuccess(res, result, 'Response to blood request recorded successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const bloodRequestsController = new BloodRequestsController();

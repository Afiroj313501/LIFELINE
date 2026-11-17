import { Request, Response, NextFunction } from 'express';
import { bloodRequestsService } from './blood-requests.service';
import { sendSuccess } from '../../common/response';
import { UnauthorizedError } from '../../common/errors';
import { listBloodRequestsQuerySchema } from './blood-requests.validator';

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

  public getRequestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await bloodRequestsService.getRequestById(id);
      sendSuccess(res, result, 'Blood request details retrieved', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const bloodRequestsController = new BloodRequestsController();

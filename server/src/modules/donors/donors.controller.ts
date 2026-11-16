import { Request, Response, NextFunction } from 'express';
import { donorsService } from './donors.service';
import { sendSuccess } from '../../common/response';
import { UnauthorizedError } from '../../common/errors';

export class DonorsController {
  public getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await donorsService.getProfileByUserId(userId);
      sendSuccess(res, result, 'Donor profile retrieved', 200);
    } catch (error) {
      next(error);
    }
  };

  public updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const clientInfo = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const result = await donorsService.upsertProfile(userId, req.body, clientInfo);
      sendSuccess(res, result, 'Donor profile updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public updateAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await donorsService.toggleAvailability(userId, req.body.isAvailable);
      sendSuccess(res, result, 'Availability status updated successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const donorsController = new DonorsController();

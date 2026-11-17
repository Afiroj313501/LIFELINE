import { Request, Response, NextFunction } from 'express';
import { volunteersService } from './volunteers.service';
import { sendSuccess } from '../../common/response';
import { UnauthorizedError, BadRequestError } from '../../common/errors';
import {
  registerVolunteerSchema,
  listVolunteersQuerySchema,
} from './volunteers.validator';

export class VolunteersController {
  public registerVolunteer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const validatedBody = registerVolunteerSchema.parse(req.body);
      const result = await volunteersService.registerVolunteer(userId, validatedBody);
      sendSuccess(res, result, 'Volunteer profile registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public getMyProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await volunteersService.getMyProfile(userId);
      sendSuccess(res, result, 'Volunteer profile retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public getMyDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await volunteersService.getMyDashboard(userId);
      sendSuccess(res, result, 'Volunteer dashboard retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public listVolunteers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedQuery = listVolunteersQuerySchema.parse(req.query);
      const result = await volunteersService.listVolunteers(validatedQuery);
      sendSuccess(res, result, 'Volunteers retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public verifyVolunteer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Volunteer ID is required');
      }

      const result = await volunteersService.verifyVolunteer(id);
      sendSuccess(res, result, 'Volunteer verified successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const volunteersController = new VolunteersController();

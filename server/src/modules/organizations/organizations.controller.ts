import { Request, Response, NextFunction } from 'express';
import { organizationsService } from './organizations.service';
import { sendSuccess } from '../../common/response';
import { UnauthorizedError, BadRequestError } from '../../common/errors';
import {
  listOrganizationsQuerySchema,
  createOrganizationSchema,
  addMemberSchema,
} from './organizations.validator';

export class OrganizationsController {
  public listOrganizations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedQuery = listOrganizationsQuerySchema.parse(req.query);
      const result = await organizationsService.listOrganizations(validatedQuery);
      sendSuccess(res, result, 'Organizations retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public getOrganizationById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Organization ID is required');
      }

      const result = await organizationsService.getOrganizationById(id);
      sendSuccess(res, result, 'Organization retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public createOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const validatedBody = createOrganizationSchema.parse(req.body);
      const result = await organizationsService.createOrganization(userId, validatedBody);
      sendSuccess(res, result, 'Organization registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public getOrganizationDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Organization ID is required');
      }

      const result = await organizationsService.getOrganizationDashboard(id, userId);
      sendSuccess(res, result, 'Organization dashboard metrics retrieved', 200);
    } catch (error) {
      next(error);
    }
  };

  public addMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Organization ID is required');
      }

      const validatedBody = addMemberSchema.parse(req.body);
      const result = await organizationsService.addMember(id, userId, validatedBody);
      sendSuccess(res, result, 'Staff member added successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public removeMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id, memberId } = req.params;
      if (!id || !memberId) {
        throw new BadRequestError('Organization ID and Member User ID are required');
      }

      await organizationsService.removeMember(id, userId, memberId);
      sendSuccess(res, null, 'Staff member removed successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const organizationsController = new OrganizationsController();

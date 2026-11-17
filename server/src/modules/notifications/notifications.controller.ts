import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../common/response';
import { UnauthorizedError, BadRequestError } from '../../common/errors';
import { listNotificationsQuerySchema } from './notifications.validator';

export class NotificationsController {
  public getMyNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const validatedQuery = listNotificationsQuerySchema.parse(req.query);
      const result = await notificationsService.getUserNotifications(userId, validatedQuery);

      sendSuccess(res, result, 'Notifications retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const unreadCount = await notificationsService.getUnreadCount(userId);
      sendSuccess(res, { unreadCount }, 'Unread count retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  };

  public markAsRead = async (
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
        throw new BadRequestError('Notification ID is required');
      }

      const result = await notificationsService.markAsRead(userId, id);
      sendSuccess(res, result, 'Notification marked as read', 200);
    } catch (error) {
      next(error);
    }
  };

  public markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await notificationsService.markAllAsRead(userId);
      sendSuccess(res, result, 'All notifications marked as read', 200);
    } catch (error) {
      next(error);
    }
  };

  public deleteNotification = async (
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
        throw new BadRequestError('Notification ID is required');
      }

      await notificationsService.deleteNotification(userId, id);
      sendSuccess(res, null, 'Notification deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  };
}

export const notificationsController = new NotificationsController();

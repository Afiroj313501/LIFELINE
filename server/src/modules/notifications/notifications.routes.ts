import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All notification endpoints require user authentication
router.use(authenticate);

router.get('/', notificationsController.getMyNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.patch('/mark-all-read', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead);
router.delete('/:id', notificationsController.deleteNotification);

export default router;

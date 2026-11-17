import { Notification, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../services/prisma';
import { NotFoundError } from '../../common/errors';
import { emitToUser, emitToGeo } from '../../services/socket';
import { ListNotificationsQuery } from './notifications.validator';

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class NotificationsService {
  /**
   * Get user's notifications with pagination and filters
   */
  public async getUserNotifications(
    userId: string,
    query: ListNotificationsQuery
  ): Promise<PaginatedNotifications> {
    const { page, limit, isRead, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      recipientId: userId,
      ...(isRead !== undefined ? { isRead } : {}),
      ...(type ? { type } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get count of unread notifications for a user
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  /**
   * Create and immediately dispatch an in-app notification
   */
  public async createNotification(input: {
    recipientId: string;
    type?: NotificationType;
    title: string;
    body: string;
    data?: Prisma.InputJsonValue;
  }): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        type: input.type || NotificationType.SYSTEM,
        title: input.title,
        body: input.body,
        data: input.data ?? Prisma.JsonNull,
      },
    });

    // Push real-time event to recipient's active socket room
    emitToUser(input.recipientId, 'new_notification', notification);

    return notification;
  }

  /**
   * Broadcast emergency notifications to compatible donors in a region
   */
  public async broadcastEmergencyNotification(
    requestId: string,
    donorUserIds: string[],
    details: {
      bloodGroup: string;
      hospitalName: string;
      urgencyLevel: string;
      division: string;
      district: string;
      unitsNeeded: number;
    }
  ): Promise<number> {
    if (donorUserIds.length === 0) return 0;

    const formattedBloodGroup = details.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
    const title = `🚨 URGENT: ${formattedBloodGroup} Blood Needed at ${details.hospitalName}`;
    const body = `Emergency blood request for ${details.unitsNeeded} unit(s) in ${details.district}, ${details.division}. Urgency: ${details.urgencyLevel}.`;

    const notificationsData = donorUserIds.map((recipientId) => ({
      recipientId,
      type: NotificationType.EMERGENCY_BROADCAST,
      title,
      body,
      data: {
        requestId,
        urgencyLevel: details.urgencyLevel,
        bloodGroup: details.bloodGroup,
        hospitalName: details.hospitalName,
      },
    }));

    // Batch persist in database
    await prisma.notification.createMany({
      data: notificationsData,
    });

    // Real-time socket dispatch to all recipients
    donorUserIds.forEach((recipientId) => {
      emitToUser(recipientId, 'emergency_alert', {
        requestId,
        title,
        body,
        details,
      });
    });

    // Real-time geographic room notification for volunteers and hospitals
    emitToGeo(details.division, details.district, 'emergency_broadcast', {
      requestId,
      title,
      body,
      details,
    });

    return donorUserIds.length;
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.recipientId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Mark all unread notifications as read for a user
   */
  public async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.recipientId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}

export const notificationsService = new NotificationsService();

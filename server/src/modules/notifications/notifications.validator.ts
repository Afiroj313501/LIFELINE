import { z } from 'zod';
import { NotificationType } from '@prisma/client';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  type: z.nativeEnum(NotificationType).optional(),
});

export const createNotificationSchema = z.object({
  recipientId: z.string().uuid('Valid recipient UUID is required'),
  type: z.nativeEnum(NotificationType).default(NotificationType.SYSTEM),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  data: z.record(z.unknown()).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

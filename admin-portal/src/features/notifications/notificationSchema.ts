import { z } from 'zod';

export const notificationFormSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  body: z.string().trim().min(5, 'Message is required'),
  type: z.enum(['order_update', 'promotional', 'general']),
  targetUserId: z.string().trim().optional(),
});

export type NotificationFormInput = z.input<typeof notificationFormSchema>;
export type NotificationFormValues = z.output<typeof notificationFormSchema>;

export const emptyNotificationForm: NotificationFormInput = {
  title: '',
  body: '',
  type: 'general',
  targetUserId: '',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationFormValues['type'], string> = {
  order_update: 'Order Update',
  promotional: 'Promotional',
  general: 'General',
};

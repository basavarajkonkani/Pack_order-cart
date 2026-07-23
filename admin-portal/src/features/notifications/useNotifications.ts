import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNotification, deleteNotification, fetchAllNotifications, type NotificationInput } from './notificationsApi';

const NOTIFICATIONS_KEY = ['notifications'];

export function useNotifications() {
  return useQuery({ queryKey: NOTIFICATIONS_KEY, queryFn: fetchAllNotifications, staleTime: 15_000 });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NotificationInput) => createNotification(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

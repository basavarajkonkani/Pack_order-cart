import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import {
  notificationFormSchema,
  emptyNotificationForm,
  NOTIFICATION_TYPE_LABELS,
  type NotificationFormInput,
  type NotificationFormValues,
} from './notificationSchema';
import { useCreateNotification, useDeleteNotification, useNotifications } from './useNotifications';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { AppNotification } from '@/types/firestore';

function formatDate(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toLocaleString('en-IN');
  }
  return '—';
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading, isError } = useNotifications();
  const createMutation = useCreateNotification();
  const deleteMutation = useDeleteNotification();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteTarget, setDeleteTarget] = useState<AppNotification | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NotificationFormInput, unknown, NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: emptyNotificationForm,
  });

  const onSubmit = async (values: NotificationFormValues) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        targetUserId: values.targetUserId || undefined,
      });
      enqueueSnackbar('Notification sent', { variant: 'success' });
      reset(emptyNotificationForm);
    } catch {
      enqueueSnackbar('Failed to send notification', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      enqueueSnackbar('Notification deleted', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to delete notification', { variant: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="h5">Notifications</Typography>

      {isError && <Alert severity="error">Failed to load notifications.</Alert>}

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Send a Notification
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                {...register('title')}
                label="Title"
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <TextField {...field} select label="Type" fullWidth>
                    {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('body')}
                label="Message"
                fullWidth
                multiline
                minRows={3}
                error={!!errors.body}
                helperText={errors.body?.message}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('targetUserId')}
                label="Target User ID (optional)"
                fullWidth
                placeholder="Leave blank to broadcast to all customers"
                helperText="If set, only this user's uid will receive the notification"
              />
            </Grid>
            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SendIcon />}
                disabled={isSubmitting}
                sx={{ minWidth: 160 }}
              >
                {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Send Notification'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Sent Notifications
          </Typography>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Audience</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{n.title}</TableCell>
                  <TableCell>
                    <Chip label={NOTIFICATION_TYPE_LABELS[n.type] ?? n.type} size="small" />
                  </TableCell>
                  <TableCell>{n.targetUserId ? n.targetUserId : 'All customers'}</TableCell>
                  <TableCell>{formatDate(n.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(n)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {notifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No notifications sent yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete notification?"
        message={`This will permanently delete "${deleteTarget?.title}".`}
        confirmLabel="Delete"
        confirmColor="error"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}

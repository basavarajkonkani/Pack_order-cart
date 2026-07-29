import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useSnackbar } from 'notistack';
import { auth } from '@/lib/firebase';
import { changePasswordSchema, type ChangePasswordValues } from './passwordSchema';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

function changePasswordError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Current password is incorrect.';
      case 'auth/weak-password':
        return 'Pick a stronger password (at least 6 characters).';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again.';
      case 'auth/requires-recent-login':
        return 'Your session is too old. Sign out, sign back in, and try again.';
      default:
        return 'Could not update the password. Please try again.';
    }
  }
  return 'Could not update the password. Please try again.';
}

export default function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      {/* Keyed on `open` so every reopen mounts a fresh form and no password
          value survives in state after the dialog closes. */}
      <ChangePasswordForm key={String(open)} onClose={onClose} />
    </Dialog>
  );
}

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    setError(null);
    const user = auth.currentUser;
    if (!user?.email) {
      setError('You are signed out. Sign in again to change your password.');
      return;
    }
    try {
      // Firebase rejects updatePassword on a stale session, so prove the
      // current password first. This also stops someone using an unattended
      // open tab to take over the account.
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, values.currentPassword));
      await updatePassword(user, values.newPassword);
      enqueueSnackbar('Password updated', { variant: 'success' });
      onClose();
    } catch (err) {
      setError(changePasswordError(err));
    }
  };

  const toggleVisibility = (
    <InputAdornment position="end">
      <IconButton onClick={() => setShowPasswords((s) => !s)} edge="end" size="small">
        {showPasswords ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <>
      <DialogTitle>Change Password</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <DialogContentText variant="body2" sx={{ mb: 2 }}>
            Signed in as {auth.currentUser?.email}
          </DialogContentText>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                {...register('currentPassword')}
                label="Current Password"
                type={showPasswords ? 'text' : 'password'}
                fullWidth
                autoFocus
                autoComplete="current-password"
                error={!!errors.currentPassword}
                helperText={errors.currentPassword?.message}
                slotProps={{ input: { endAdornment: toggleVisibility } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('newPassword')}
                label="New Password"
                type={showPasswords ? 'text' : 'password'}
                fullWidth
                autoComplete="new-password"
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('confirmPassword')}
                label="Confirm New Password"
                type={showPasswords ? 'text' : 'password'}
                fullWidth
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ minWidth: 140 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Box>
    </>
  );
}

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Link,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useUpdatePackagingRequest } from './usePackagingRequests';
import { PACKAGING_STATUS_OPTIONS, PACKAGING_STATUS_CONFIG } from './packagingStatusConfig';
import type { PackagingRequest, PackagingRequestStatus } from '@/types/firestore';

interface PackagingRequestDialogProps {
  open: boolean;
  onClose: () => void;
  request?: PackagingRequest;
}

export default function PackagingRequestDialog({ open, onClose, request }: PackagingRequestDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Keyed by request id so local status/notes state always initializes
          fresh from `request`, instead of needing an effect to sync it. */}
      <PackagingRequestDialogContent key={request.id} onClose={onClose} request={request} />
    </Dialog>
  );
}

interface PackagingRequestDialogContentProps {
  onClose: () => void;
  request: PackagingRequest;
}

function PackagingRequestDialogContent({ onClose, request }: PackagingRequestDialogContentProps) {
  const { enqueueSnackbar } = useSnackbar();
  const updateMutation = useUpdatePackagingRequest();

  const [status, setStatus] = useState<PackagingRequestStatus>(request.status);
  const [notes, setNotes] = useState(request.notes ?? '');

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: request.id, data: { status, notes } });
      enqueueSnackbar('Request updated', { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Failed to update request', { variant: 'error' });
    }
  };

  return (
    <>
      <DialogTitle>{request.service}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Customer
          </Typography>
          <Typography variant="body2">{request.customerName || request.userId}</Typography>
        </Box>
        {request.message && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Message
            </Typography>
            <Typography variant="body2">{request.message}</Typography>
          </Box>
        )}
        {request.artworkUrls && request.artworkUrls.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Artwork Files
            </Typography>
            {request.artworkUrls.map((url, i) => (
              <Link key={url} href={url} target="_blank" rel="noopener noreferrer" variant="body2">
                Attachment {i + 1}
              </Link>
            ))}
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PackagingRequestStatus)}
            fullWidth
          >
            {PACKAGING_STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {PACKAGING_STATUS_CONFIG[s].label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Internal Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder="Notes visible only to admins..."
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={updateMutation.isPending} sx={{ minWidth: 120 }}>
          {updateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </>
  );
}

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useSnackbar } from 'notistack';
import { useOrder, useUpdateOrderStatus } from './useOrders';
import OrderStatusChip from '@/components/OrderStatusChip';
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_CONFIG } from '@/components/orderStatusConfig';
import { getItemTitle, getItemSpec } from '@/features/orders/orderItemHelpers';
import type { OrderStatus } from '@/types/firestore';

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/orders')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Order not found</Typography>
        </Box>
      </Box>
    );
  }

  // Keyed by order.id so the status-editing form below always initializes
  // its local state fresh from the freshly-loaded order, without needing an
  // effect to sync state after the query resolves.
  return <OrderDetailContent key={order.id} order={order} onBack={() => navigate('/orders')} />;
}

interface OrderDetailContentProps {
  order: NonNullable<ReturnType<typeof useOrder>['data']>;
  onBack: () => void;
}

function OrderDetailContent({ order, onBack }: OrderDetailContentProps) {
  const { enqueueSnackbar } = useSnackbar();
  const updateMutation = useUpdateOrderStatus();

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '');
  const [courierName, setCourierName] = useState(order.courierName ?? '');

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: order.id, data: { status, trackingNumber, courierName } });
      enqueueSnackbar('Order updated', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to update order', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 1000 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">{order.orderId}</Typography>
        <OrderStatusChip status={order.status} />
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Items
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getItemTitle(item)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {getItemSpec(item)}
                      </Typography>
                      {item.artworkUrl && (
                        <Link
                          href={item.artworkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                        >
                          <AttachFileIcon sx={{ fontSize: 14 }} />
                          {item.artworkName ?? 'Artwork file'}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">Total</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {formatCurrency(order.total)}
              </Typography>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mt: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Shipping & Billing
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">
                  Delivery Address
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {order.address}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  GST Number
                </Typography>
                <Typography variant="body2">{order.gstNumber || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Payment Method
                </Typography>
                <Typography variant="body2">
                  <Chip label={order.paymentMethod} size="small" />
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Order Date
                </Typography>
                <Typography variant="body2">{new Date(order.createdAt).toLocaleString('en-IN')}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Update Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                fullWidth
              >
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {ORDER_STATUS_CONFIG[s].label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Courier Name"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                fullWidth
                placeholder="e.g. Delhivery, BlueDart"
              />
              <TextField
                label="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                sx={{ mt: 1 }}
              >
                {updateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

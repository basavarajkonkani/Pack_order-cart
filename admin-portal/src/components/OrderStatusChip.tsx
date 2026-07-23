import { Chip } from '@mui/material';
import type { OrderStatus } from '@/types/firestore';
import { ORDER_STATUS_CONFIG } from './orderStatusConfig';

export default function OrderStatusChip({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUS_CONFIG[status] ?? { label: status, color: '#334155', bg: '#e2e8f0' };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: 12 }}
    />
  );
}

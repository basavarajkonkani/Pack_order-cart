import { Chip } from '@mui/material';
import type { PackagingRequestStatus } from '@/types/firestore';
import { PACKAGING_STATUS_CONFIG } from './packagingStatusConfig';

export default function PackagingStatusChip({ status }: { status: PackagingRequestStatus }) {
  const cfg = PACKAGING_STATUS_CONFIG[status] ?? { label: status, color: '#334155', bg: '#e2e8f0' };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: 12 }}
    />
  );
}

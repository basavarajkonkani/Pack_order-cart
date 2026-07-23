import { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { usePackagingRequests } from './usePackagingRequests';
import PackagingStatusChip from './PackagingStatusChip';
import PackagingRequestDialog from './PackagingRequestDialog';
import { PACKAGING_STATUS_OPTIONS, PACKAGING_STATUS_CONFIG } from './packagingStatusConfig';
import type { PackagingRequest, PackagingRequestStatus } from '@/types/firestore';

function formatDate(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString('en-IN');
  }
  return '—';
}

export default function PackagingRequestsListPage() {
  const { data: requests = [], isLoading, isError } = usePackagingRequests();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackagingRequestStatus | 'all'>('all');
  const [selected, setSelected] = useState<PackagingRequest | undefined>(undefined);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesQuery = !q || r.service.toLowerCase().includes(q) || (r.customerName ?? '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="h5">Custom Packaging Requests</Typography>

      {isError && <Alert severity="error">Failed to load packaging requests.</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by service or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PackagingRequestStatus | 'all')}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            {PACKAGING_STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {PACKAGING_STATUS_CONFIG[s].label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelected(r)}>
                  <TableCell sx={{ fontWeight: 600 }}>{r.service}</TableCell>
                  <TableCell>{r.customerName || r.userId}</TableCell>
                  <TableCell>{formatDate(r.createdAt)}</TableCell>
                  <TableCell>
                    <PackagingStatusChip status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No packaging requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <PackagingRequestDialog open={!!selected} onClose={() => setSelected(undefined)} request={selected} />
    </Box>
  );
}

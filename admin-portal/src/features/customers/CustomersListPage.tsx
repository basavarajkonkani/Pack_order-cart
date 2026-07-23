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
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useSnackbar } from 'notistack';
import { useCustomers, useSetCustomerRole } from './useCustomers';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { UserProfile } from '@/types/firestore';

export default function CustomersListPage() {
  const { data: customers = [], isLoading, isError } = useCustomers();
  const roleMutation = useSetCustomerRole();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuCustomer, setMenuCustomer] = useState<UserProfile | null>(null);
  const [roleTarget, setRoleTarget] = useState<UserProfile | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q) ||
        c.uid.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const nextRole = roleTarget ? (roleTarget.role === 'admin' ? 'customer' : 'admin') : 'admin';

  const handleToggleRole = async () => {
    if (!roleTarget) return;
    try {
      await roleMutation.mutateAsync({ uid: roleTarget.uid, role: nextRole });
      enqueueSnackbar(`${roleTarget.name ?? roleTarget.uid} is now ${nextRole}`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to update role', { variant: 'error' });
    } finally {
      setRoleTarget(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="h5">Customers</Typography>

      {isError && <Alert severity="error">Failed to load customers.</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email, phone, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Addresses</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.uid} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 38, height: 38, fontSize: 14 }}>
                        {(c.name ?? c.uid).charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.name || 'Unnamed'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.uid}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{c.email || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.phone || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{c.company || '—'}</TableCell>
                  <TableCell>{c.addresses?.length ?? 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.role}
                      size="small"
                      color={c.role === 'admin' ? 'primary' : 'default'}
                      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setMenuCustomer(c);
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setRoleTarget(menuCustomer);
            setMenuAnchor(null);
          }}
        >
          {menuCustomer?.role === 'admin' ? 'Revoke Admin Access' : 'Grant Admin Access'}
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={!!roleTarget}
        title={nextRole === 'admin' ? 'Grant admin access?' : 'Revoke admin access?'}
        message={
          nextRole === 'admin'
            ? `"${roleTarget?.name ?? roleTarget?.uid}" will get full access to this Admin Portal.`
            : `"${roleTarget?.name ?? roleTarget?.uid}" will lose access to this Admin Portal.`
        }
        confirmLabel={nextRole === 'admin' ? 'Grant Access' : 'Revoke Access'}
        confirmColor={nextRole === 'admin' ? 'primary' : 'error'}
        onClose={() => setRoleTarget(null)}
        onConfirm={handleToggleRole}
        loading={roleMutation.isPending}
      />
    </Box>
  );
}

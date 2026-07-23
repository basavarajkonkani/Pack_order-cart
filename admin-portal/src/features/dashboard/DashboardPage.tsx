import { Grid, Paper, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, Alert } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmptyOutlined';
import PaidIcon from '@mui/icons-material/PaidOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/StatCard';
import OrderStatusChip from '@/components/OrderStatusChip';
import { useDashboardStats } from './useDashboardStats';
import type { OrderStatus } from '@/types/firestore';

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats();
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {isError && <Alert severity="error">Failed to load dashboard data. Check your Firebase connection.</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard label="Total Products" value={data?.totalProducts ?? 0} icon={Inventory2Icon} color="#166534" loading={isLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard label="Total Orders" value={data?.totalOrders ?? 0} icon={ReceiptLongIcon} color="#1d4ed8" loading={isLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard label="Pending Orders" value={data?.pendingOrders ?? 0} icon={HourglassEmptyIcon} color="#d97706" loading={isLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard label="Revenue" value={formatCurrency(data?.revenue ?? 0)} icon={PaidIcon} color="#0e7490" loading={isLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <StatCard label="Customers" value={data?.totalCustomers ?? 0} icon={PeopleIcon} color="#7e22ce" loading={isLoading} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
              Revenue — Last 7 Days
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data?.revenueByDay ?? []}>
                <defs>
                  <linearGradient id="revColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#166534" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#166534" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Area type="monotone" dataKey="revenue" stroke="#166534" fill="url(#revColor)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
              Orders by Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
              {Object.entries(data?.ordersByStatus ?? {}).length === 0 && !isLoading && (
                <Typography variant="body2" color="text.secondary">
                  No orders yet.
                </Typography>
              )}
              {Object.entries(data?.ordersByStatus ?? {}).map(([status, count]) => (
                <Box key={status} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <OrderStatusChip status={status as OrderStatus} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Recent Orders
          </Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.recentOrders ?? []).map((order) => (
              <TableRow
                key={order.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <TableCell sx={{ fontWeight: 600 }}>{order.orderId}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>{order.items?.length ?? 0}</TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <OrderStatusChip status={order.status} />
                </TableCell>
              </TableRow>
            ))}
            {(data?.recentOrders ?? []).length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

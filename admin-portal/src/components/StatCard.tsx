import { Paper, Box, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: SvgIconComponent;
  color?: string;
  loading?: boolean;
}

export default function StatCard({ label, value, icon: Icon, color = '#166534', loading }: StatCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2,
            bgcolor: `${color}1A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ color }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ overflowWrap: 'break-word', lineHeight: 1.3 }}
          >
            {label}
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 700 }}>
            {loading ? '—' : value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

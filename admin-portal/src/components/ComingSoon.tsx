import { Paper, Typography, Box } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/ConstructionOutlined';

/** Placeholder for modules not yet built out, so routing/nav works end to end. */
export default function ComingSoon({ title }: { title: string }) {
  return (
    <Paper elevation={0} sx={{ p: 6, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <ConstructionIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          This module is being built next.
        </Typography>
      </Box>
    </Paper>
  );
}

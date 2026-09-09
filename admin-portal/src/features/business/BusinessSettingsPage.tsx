import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import VerifiedIcon from '@mui/icons-material/VerifiedOutlined';
import { useSnackbar } from 'notistack';
import { businessFormSchema, type BusinessFormInput, type BusinessFormValues } from './businessSchema';
import { useBusinessSettings, useUpdateBusinessSettings } from './useBusinessSettings';

export default function BusinessSettingsPage() {
  const { data: businessSettings, isLoading, isError } = useBusinessSettings();
  const updateMutation = useUpdateBusinessSettings();
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BusinessFormInput, unknown, BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
  });

  useEffect(() => {
    if (businessSettings) {
      reset({
        gstin: businessSettings.gstin,
        businessName: businessSettings.businessName,
        legalName: businessSettings.legalName,
        address: businessSettings.address,
        city: businessSettings.city,
        state: businessSettings.state,
        pincode: businessSettings.pincode,
        gstPercentage: businessSettings.gstPercentage,
      });
    }
  }, [businessSettings, reset]);

  const onSubmit = async (values: BusinessFormValues) => {
    try {
      await updateMutation.mutateAsync(values);
      enqueueSnackbar('Business settings saved successfully', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to save business settings', { variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 1000 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <BusinessIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">Business Settings</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage GST details and business information for invoices
          </Typography>
        </Box>
        {businessSettings?.gstin && (
          <Chip
            icon={<VerifiedIcon />}
            label="GST Registered"
            color="success"
            variant="outlined"
          />
        )}
      </Box>

      {isError && <Alert severity="error">Failed to load business settings.</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            GST Information
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('gstin')}
                label="GSTIN"
                fullWidth
                placeholder="29AQEPJ1802F1Z7"
                error={!!errors.gstin}
                helperText={errors.gstin?.message || '15-character GST Identification Number'}
                slotProps={{
                  input: {
                    style: { fontFamily: 'monospace', letterSpacing: '0.5px' }
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('gstPercentage')}
                label="GST Rate"
                type="number"
                fullWidth
                error={!!errors.gstPercentage}
                helperText={errors.gstPercentage?.message}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Business Details
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('businessName')}
                label="Business Name"
                fullWidth
                placeholder="Jeyd Solutions"
                error={!!errors.businessName}
                helperText={errors.businessName?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('legalName')}
                label="Legal Name"
                fullWidth
                placeholder="PRASHANTH JAIKUMAR"
                error={!!errors.legalName}
                helperText={errors.legalName?.message}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('address')}
                label="Address"
                fullWidth
                multiline
                minRows={2}
                placeholder="32, 1st Floor, Ashirvad Nilaya, 1st Cross Road, Vijaya Nagar"
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('city')}
                label="City"
                fullWidth
                placeholder="Bengaluru"
                error={!!errors.city}
                helperText={errors.city?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('state')}
                label="State"
                fullWidth
                placeholder="Karnataka"
                error={!!errors.state}
                helperText={errors.state?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('pincode')}
                label="PIN Code"
                fullWidth
                placeholder="560040"
                error={!!errors.pincode}
                helperText={errors.pincode?.message}
              />
            </Grid>
          </Grid>
        </Paper>

        <Alert severity="info" sx={{ mb: 2.5 }}>
          These details will appear on all GST invoices generated for customer orders. 
          Ensure they match your GST registration certificate.
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isSubmitting} 
            sx={{ minWidth: 160 }}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save Settings'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

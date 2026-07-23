import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { settingsFormSchema, type SettingsFormInput, type SettingsFormValues } from './settingsSchema';
import { useStoreSettings, useUpdateStoreSettings } from './useSettings';

export default function SettingsPage() {
  const { data: settings, isLoading, isError } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();
  const { enqueueSnackbar } = useSnackbar();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
  });

  useEffect(() => {
    if (settings) {
      reset({
        companyName: settings.companyName,
        companyEmail: settings.companyEmail ?? '',
        companyPhone: settings.companyPhone ?? '',
        companyAddress: settings.companyAddress ?? '',
        gstNumber: settings.gstNumber ?? '',
        taxPercent: settings.taxPercent,
        shippingFlatRate: settings.shippingFlatRate,
        freeShippingThreshold: settings.freeShippingThreshold ?? 0,
        paymentMethods: settings.paymentMethods,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateMutation.mutateAsync({
        ...values,
        companyEmail: values.companyEmail || undefined,
      });
      enqueueSnackbar('Settings saved', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to save settings', { variant: 'error' });
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 900 }}>
      <Typography variant="h5">Settings</Typography>

      {isError && <Alert severity="error">Failed to load settings.</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Company Details
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('companyName')}
                label="Company Name"
                fullWidth
                error={!!errors.companyName}
                helperText={errors.companyName?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('gstNumber')}
                label="GST Number"
                fullWidth
                error={!!errors.gstNumber}
                helperText={errors.gstNumber?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('companyEmail')}
                label="Company Email"
                fullWidth
                error={!!errors.companyEmail}
                helperText={errors.companyEmail?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField {...register('companyPhone')} label="Company Phone" fullWidth />
            </Grid>
            <Grid size={12}>
              <TextField {...register('companyAddress')} label="Company Address" fullWidth multiline minRows={2} />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Tax & Shipping
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('taxPercent')}
                label="Tax Rate"
                type="number"
                fullWidth
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                error={!!errors.taxPercent}
                helperText={errors.taxPercent?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('shippingFlatRate')}
                label="Flat Shipping Rate"
                type="number"
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                error={!!errors.shippingFlatRate}
                helperText={errors.shippingFlatRate?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('freeShippingThreshold')}
                label="Free Shipping Above"
                type="number"
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                error={!!errors.freeShippingThreshold}
                helperText={errors.freeShippingThreshold?.message}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Payment Methods
          </Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                control={control}
                name="paymentMethods.upi"
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="UPI"
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                control={control}
                name="paymentMethods.bankTransfer"
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Bank Transfer"
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                control={control}
                name="paymentMethods.creditTerms"
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Credit Terms"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ minWidth: 160 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save Settings'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

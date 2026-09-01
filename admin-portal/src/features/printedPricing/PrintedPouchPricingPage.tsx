import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useSnackbar } from 'notistack';
import { usePrintedPricing, useSavePrintedPricing } from './usePrintedPricing';
import { DEFAULT_PRINTED_PRICING, type PrintedPouchPricing } from './printedPricingApi';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const positiveNum = (label: string) =>
  z
    .number({ error: `${label} must be a number` })
    .positive(`${label} must be greater than 0`);

const schema = z.object({
  // Combination prices
  noWindowNonMetal: positiveNum('No Window / Non-Metalised price'),
  noWindowMetal:    positiveNum('No Window / Metalised price'),
  windowNonMetal:   positiveNum('With Window / Non-Metalised price'),
  windowMetal:      positiveNum('With Window / Metalised price'),
  // Capacity multipliers
  cap50g:  positiveNum('50g multiplier'),
  cap100g: positiveNum('100g multiplier'),
  cap250g: positiveNum('250g multiplier'),
  cap500g: positiveNum('500g multiplier'),
  cap1kg:  positiveNum('1kg multiplier'),
  // Order settings
  minOrderQuantity: z
    .number({ error: 'Min order must be a number' })
    .int('Min order must be a whole number')
    .min(100, 'Min order must be at least 100'),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pricingToForm(p: Omit<PrintedPouchPricing, 'updatedAt'>): FormValues {
  return {
    noWindowNonMetal: p.combinations.noWindowNonMetal,
    noWindowMetal:    p.combinations.noWindowMetal,
    windowNonMetal:   p.combinations.windowNonMetal,
    windowMetal:      p.combinations.windowMetal,
    cap50g:  p.capacityMultipliers['50g'],
    cap100g: p.capacityMultipliers['100g'],
    cap250g: p.capacityMultipliers['250g'],
    cap500g: p.capacityMultipliers['500g'],
    cap1kg:  p.capacityMultipliers['1kg'],
    minOrderQuantity: p.minOrderQuantity,
  };
}

function formToPricing(v: FormValues): Omit<PrintedPouchPricing, 'updatedAt'> {
  return {
    combinations: {
      noWindowNonMetal: v.noWindowNonMetal,
      noWindowMetal:    v.noWindowMetal,
      windowNonMetal:   v.windowNonMetal,
      windowMetal:      v.windowMetal,
    },
    capacityMultipliers: {
      '50g':  v.cap50g,
      '100g': v.cap100g,
      '250g': v.cap250g,
      '500g': v.cap500g,
      '1kg':  v.cap1kg,
    },
    minOrderQuantity: v.minOrderQuantity,
  };
}

// ---------------------------------------------------------------------------
// Reusable price input field
// ---------------------------------------------------------------------------

function PriceField({
  name,
  label,
  control,
  errors,
  helperText,
  adornment = '₹',
}: {
  name: keyof FormValues;
  label: string;
  control: ReturnType<typeof useForm<FormValues>>['control'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
  helperText?: string;
  adornment?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={label}
          type="number"
          size="small"
          fullWidth
          error={!!errors[name]}
          helperText={(errors[name]?.message as string) ?? helperText}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">{adornment}</InputAdornment>
              ),
            },
            htmlInput: { step: 'any', min: 0 },
          }}
          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      )}
    />
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Tooltip title={hint} arrow>
        <InfoOutlinedIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
      </Tooltip>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Preview table — one table per capacity, rows = combinations, cols = qty
// ---------------------------------------------------------------------------

const PREVIEW_QUANTITIES = [1000, 5000, 10000, 25000];
const CAPACITIES = ['50g', '100g', '250g', '500g', '1kg'] as const;

type ComboKey = 'noWindowNonMetal' | 'noWindowMetal' | 'windowNonMetal' | 'windowMetal';
const COMBOS: { key: ComboKey; label: string }[] = [
  { key: 'noWindowNonMetal', label: 'No Window / Non-Metalised' },
  { key: 'noWindowMetal',    label: 'No Window / Metalised' },
  { key: 'windowNonMetal',   label: 'With Window / Non-Metalised' },
  { key: 'windowMetal',      label: 'With Window / Metalised' },
];

function computePrice(
  pricing: ReturnType<typeof formToPricing>,
  comboKey: ComboKey,
  cap: (typeof CAPACITIES)[number],
  qty: number,
): string {
  const pricePerPiece = pricing.combinations[comboKey] * pricing.capacityMultipliers[cap];
  return `₹${Math.round(pricePerPiece * qty).toLocaleString('en-IN')}`;
}

function PricePreviewTable({ values }: { values: FormValues }) {
  const pricing = formToPricing(values);

  return (
    <Box>
      <SectionHeader
        title="Price Preview"
        hint="Total order prices = price per piece × capacity multiplier × quantity. Each row is one combination; each column is a quantity."
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Formula: combination price × capacity multiplier × quantity
      </Typography>

      {CAPACITIES.map((cap) => (
        <Box key={cap} sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }} color="text.secondary">
            Capacity: {cap} &nbsp;(multiplier ×{pricing.capacityMultipliers[cap]})
          </Typography>
          <Paper variant="outlined" sx={{ overflowX: 'auto', '& .MuiTableCell-root': { py: 1, px: 1.5 } }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><strong>Combination</strong></TableCell>
                  {PREVIEW_QUANTITIES.map((q) => (
                    <TableCell key={q} align="right">
                      <strong>{q.toLocaleString('en-IN')} pcs</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {COMBOS.map(({ key, label }) => (
                  <TableRow key={key} hover>
                    <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</TableCell>
                    {PREVIEW_QUANTITIES.map((q) => (
                      <TableCell key={q} align="right">
                        {computePrice(pricing, key, cap, q)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      ))}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PrintedPouchPricingPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: pricing, isLoading, isError, error } = usePrintedPricing();
  const saveMutation = useSavePrintedPricing();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: pricingToForm(DEFAULT_PRINTED_PRICING),
  });

  useEffect(() => {
    if (pricing) reset(pricingToForm(pricing));
  }, [pricing, reset]);

  const isPermissionError =
    isError &&
    error instanceof Error &&
    (error.message.includes('permission') ||
      error.message.includes('PERMISSION_DENIED') ||
      error.message.includes('Missing or insufficient permissions'));

  const onSubmit = async (values: FormValues) => {
    try {
      await saveMutation.mutateAsync(formToPricing(values));
      enqueueSnackbar('Pricing saved — changes will reflect in the app immediately.', { variant: 'success' });
      reset(values);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isPerm =
        msg.includes('permission') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('Missing or insufficient permissions');
      enqueueSnackbar(
        isPerm
          ? 'Permission denied — deploy Firestore rules first: firebase deploy --only firestore:rules'
          : 'Failed to save pricing. Please try again.',
        { variant: 'error', autoHideDuration: isPerm ? 8000 : 4000 },
      );
      console.error('[PrintedPouchPricing] save failed:', err);
    }
  };

  const handleReset = () => {
    reset(pricingToForm(DEFAULT_PRINTED_PRICING));
    enqueueSnackbar('Form reset to default values. Save to apply.', { variant: 'info' });
  };

  const watchedValues = watch();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rounded" height={240} />
        <Skeleton variant="rounded" height={180} />
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Printed Pouch Pricing
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Set prices for every window and material combination. Changes reflect in the customer app immediately.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleReset} disabled={saveMutation.isPending}>
            Reset to Defaults
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saveMutation.isPending || !isDirty || isPermissionError}
            sx={{ minWidth: 140 }}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Pricing'}
          </Button>
        </Box>
      </Box>

      {isError && (
        <Alert severity={isPermissionError ? 'error' : 'warning'}>
          {isPermissionError ? (
            <>
              <strong>Permission denied.</strong> Run{' '}
              <code>firebase deploy --only firestore:rules</code> then reload.
            </>
          ) : (
            'Could not load saved pricing — showing defaults. Save to create the document.'
          )}
        </Alert>
      )}

      {isDirty && !isError && (
        <Alert severity="info" sx={{ py: 0.5 }}>
          You have unsaved changes. Click <strong>Save Pricing</strong> to publish them.
        </Alert>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Combination prices (2×2 grid)                            */}
      {/* ------------------------------------------------------------------ */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
        <SectionHeader
          title="Price per Piece — by Combination"
          hint="Set the base price per piece for each window × material combination. The capacity multiplier is applied on top."
        />
        <Divider sx={{ my: 2 }} />

        {/* Without Window row */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
          Without Window
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
          <PriceField
            name="noWindowNonMetal"
            label="Non-Metalised"
            control={control}
            errors={errors}
            helperText="Without Window + Non-Metalised material"
          />
          <PriceField
            name="noWindowMetal"
            label="Metalised"
            control={control}
            errors={errors}
            helperText="Without Window + Metalised material"
          />
        </Box>

        {/* With Window row */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
          With Window
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <PriceField
            name="windowNonMetal"
            label="Non-Metalised"
            control={control}
            errors={errors}
            helperText="With Window + Non-Metalised material"
          />
          <PriceField
            name="windowMetal"
            label="Metalised"
            control={control}
            errors={errors}
            helperText="With Window + Metalised material"
          />
        </Box>
      </Paper>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Capacity multipliers                                      */}
      {/* ------------------------------------------------------------------ */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
        <SectionHeader
          title="Capacity Multipliers"
          hint="The combination price per piece is multiplied by this factor. 1.0 = no change."
        />
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' }, gap: 2.5 }}>
          {(
            [
              { name: 'cap50g',  label: '50g'  },
              { name: 'cap100g', label: '100g' },
              { name: 'cap250g', label: '250g' },
              { name: 'cap500g', label: '500g' },
              { name: 'cap1kg',  label: '1kg'  },
            ] as const
          ).map(({ name, label }) => (
            <PriceField key={name} name={name} label={label} control={control} errors={errors} adornment="×" />
          ))}
        </Box>
      </Paper>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Order settings                                            */}
      {/* ------------------------------------------------------------------ */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
        <SectionHeader
          title="Order Settings"
          hint="Minimum order quantity enforced in the customer app wizard."
        />
        <Divider sx={{ my: 2 }} />
        <Box sx={{ maxWidth: 280 }}>
          <Controller
            name="minOrderQuantity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Minimum Order Quantity"
                type="number"
                size="small"
                fullWidth
                error={!!errors.minOrderQuantity}
                helperText={(errors.minOrderQuantity?.message as string) ?? 'Minimum pieces per order'}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">pcs</InputAdornment> },
                  htmlInput: { step: 100, min: 100 },
                }}
                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
              />
            )}
          />
        </Box>
      </Paper>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Live preview                                              */}
      {/* ------------------------------------------------------------------ */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
        <PricePreviewTable values={watchedValues} />
      </Paper>
    </Box>
  );
}

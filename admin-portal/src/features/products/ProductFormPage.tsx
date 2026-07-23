import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import VideocamIcon from '@mui/icons-material/VideocamOutlined';
import { useSnackbar } from 'notistack';
import { productFormSchema, emptyProductForm, type ProductFormInput, type ProductFormValues } from './productSchema';
import { useProduct, useCreateProduct, useUpdateProduct } from './useProducts';
import { useCategories } from '@/features/categories/useCategories';
import { uploadFileSafe } from '@/lib/storage';

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { data: existing, isLoading: loadingExisting } = useProduct(isEdit ? id : undefined);
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [imageFile, setImageFile] = useState<File | null>(null);
  // Only tracks a freshly-picked local file's preview URL; falls back to the
  // existing product's imageUrl below, so it doesn't need to be synced via effect.
  const [localImagePreview, setLocalImagePreview] = useState<string | undefined>(undefined);
  const imagePreview = localImagePreview ?? existing?.imageUrl;
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyProductForm,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'sizes' });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        desc: existing.desc,
        categoryId: existing.categoryId ?? '',
        size: existing.size,
        micron: existing.micron,
        material: existing.material,
        sealing: existing.sealing,
        heatResistance: existing.heatResistance,
        moq: existing.moq,
        discountPercent: existing.discountPercent ?? 0,
        inStock: existing.inStock,
        visible: existing.visible !== false,
        sizes: existing.sizes?.length ? existing.sizes : emptyProductForm.sizes,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      let imageUrl = existing?.imageUrl;
      let videoUrl = existing?.videoUrl;

      // Image/video upload is best-effort. Firebase Storage isn't required to create a
      // product — if it's unavailable (not configured, offline, rules reject it, etc.)
      // uploadFileSafe resolves to undefined and the product is saved without media
      // instead of the whole submission failing.
      if (imageFile || videoFile) {
        setUploading(true);
        const productId = isEdit ? id! : (existing?.id ?? values.name);
        const [uploadedImageUrl, uploadedVideoUrl] = await Promise.all([
          imageFile ? uploadFileSafe('products/images', imageFile, productId) : Promise.resolve(undefined),
          videoFile ? uploadFileSafe('products/videos', videoFile, productId) : Promise.resolve(undefined),
        ]);
        setUploading(false);

        if (imageFile && !uploadedImageUrl) {
          enqueueSnackbar('Image upload unavailable — product will be saved without an image', { variant: 'warning' });
        } else if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }

        if (videoFile && !uploadedVideoUrl) {
          enqueueSnackbar('Video upload unavailable — product will be saved without a video', { variant: 'warning' });
        } else if (uploadedVideoUrl) {
          videoUrl = uploadedVideoUrl;
        }
      }

      const payload = {
        ...values,
        categoryId: values.categoryId || undefined,
        imageUrl,
        videoUrl,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: payload });
        enqueueSnackbar('Product updated', { variant: 'success' });
      } else {
        await createMutation.mutateAsync({ data: payload });
        enqueueSnackbar('Product created', { variant: 'success' });
      }
      navigate('/products');
    } catch (err) {
      setUploading(false);
      console.error(err);
      enqueueSnackbar('Failed to save product', { variant: 'error' });
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const busy = isSubmitting || uploading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 900 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton onClick={() => navigate('/products')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">{isEdit ? 'Edit Product' : 'Add Product'}</Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Basic Details
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('name')}
                label="Product Name"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <TextField {...field} select label="Category" fullWidth>
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('desc')}
                label="Description"
                fullWidth
                multiline
                minRows={3}
                error={!!errors.desc}
                helperText={errors.desc?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                control={control}
                name="size"
                render={({ field }) => (
                  <TextField {...field} select label="Size Category" fullWidth>
                    <MenuItem value="Small">Small</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Large">Large</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('micron')}
                label="Micron (thickness)"
                type="number"
                fullWidth
                error={!!errors.micron}
                helperText={errors.micron?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('moq')}
                label="MOQ (pieces)"
                type="number"
                fullWidth
                error={!!errors.moq}
                helperText={errors.moq?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('material')}
                label="Material"
                fullWidth
                error={!!errors.material}
                helperText={errors.material?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('sealing')}
                label="Sealing Type"
                fullWidth
                error={!!errors.sealing}
                helperText={errors.sealing?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('heatResistance')}
                label="Heat Resistance"
                fullWidth
                error={!!errors.heatResistance}
                helperText={errors.heatResistance?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                {...register('discountPercent')}
                label="Discount %"
                type="number"
                fullWidth
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                error={!!errors.discountPercent}
                helperText={errors.discountPercent?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                control={control}
                name="inStock"
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Enabled (in stock)"
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                control={control}
                name="visible"
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Visible in Buyer App"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Media
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar variant="rounded" src={imagePreview} sx={{ width: 64, height: 64 }} />
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImageFile(file);
                      setLocalImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button component="label" variant="outlined" startIcon={<VideocamIcon />}>
                {videoFile ? videoFile.name : existing?.videoUrl ? 'Replace Video' : 'Upload Video'}
                <input
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setVideoFile(file);
                  }}
                />
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Sizes & Pricing
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => append({ code: '', label: '', weight: '', pricePerPiece: 0 })}
            >
              Add Size
            </Button>
          </Box>
          {errors.sizes?.root && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.sizes.root.message}
            </Alert>
          )}
          {fields.map((field, index) => (
            <Box key={field.id}>
              {index > 0 && <Divider sx={{ my: 2 }} />}
              <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Grid size={{ xs: 6, sm: 2.5 }}>
                  <TextField
                    {...register(`sizes.${index}.code`)}
                    label="Code"
                    fullWidth
                    size="small"
                    error={!!errors.sizes?.[index]?.code}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    {...register(`sizes.${index}.label`)}
                    label="Dimensions"
                    fullWidth
                    size="small"
                    error={!!errors.sizes?.[index]?.label}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2.5 }}>
                  <TextField
                    {...register(`sizes.${index}.weight`)}
                    label="Weight"
                    fullWidth
                    size="small"
                    error={!!errors.sizes?.[index]?.weight}
                  />
                </Grid>
                <Grid size={{ xs: 5, sm: 2.5 }}>
                  <TextField
                    {...register(`sizes.${index}.pricePerPiece`)}
                    label="Price/piece"
                    type="number"
                    fullWidth
                    size="small"
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                    error={!!errors.sizes?.[index]?.pricePerPiece}
                  />
                </Grid>
                <Grid size={{ xs: 1, sm: 1.5 }}>
                  <IconButton onClick={() => remove(index)} disabled={fields.length === 1} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="text" onClick={() => navigate('/products')} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={busy} sx={{ minWidth: 140 }}>
            {busy ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

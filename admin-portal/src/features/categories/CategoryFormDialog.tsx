import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Box,
  Avatar,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import { useSnackbar } from 'notistack';
import { categoryFormSchema, emptyCategoryForm, type CategoryFormInput, type CategoryFormValues } from './categorySchema';
import { useCreateCategory, useUpdateCategory } from './useCategories';
import { uploadFile } from '@/lib/storage';
import type { Category } from '@/types/firestore';

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  category?: Category;
}

export default function CategoryFormDialog({ open, onClose, category }: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Keyed by open+category id so the form below always mounts fresh
          (state initializes directly from `category`), instead of needing
          an effect to reset/sync state each time the dialog reopens. */}
      <CategoryFormDialogContent key={`${open}-${category?.id ?? 'new'}`} onClose={onClose} category={category} />
    </Dialog>
  );
}

interface CategoryFormDialogContentProps {
  onClose: () => void;
  category?: Category;
}

function CategoryFormDialogContent({ onClose, category }: CategoryFormDialogContentProps) {
  const isEdit = !!category;
  const { enqueueSnackbar } = useSnackbar();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const imagePreview = localPreview ?? category?.imageUrl;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category
      ? {
          name: category.name,
          description: category.description ?? '',
          sortOrder: category.sortOrder ?? 0,
          enabled: category.enabled,
        }
      : emptyCategoryForm,
  });

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      let imageUrl = category?.imageUrl;
      if (imageFile) {
        setUploading(true);
        const id = category?.id ?? values.name;
        imageUrl = await uploadFile('categories/images', imageFile, id);
        setUploading(false);
      }

      const payload = { ...values, imageUrl };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: category!.id, data: payload });
        enqueueSnackbar('Category updated', { variant: 'success' });
      } else {
        await createMutation.mutateAsync({ data: payload });
        enqueueSnackbar('Category created', { variant: 'success' });
      }
      onClose();
    } catch (err) {
      setUploading(false);
      console.error(err);
      enqueueSnackbar('Failed to save category', { variant: 'error' });
    }
  };

  const busy = isSubmitting || uploading;

  return (
    <>
      <DialogTitle>{isEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar variant="rounded" src={imagePreview} sx={{ width: 56, height: 56 }} />
                <Button component="label" variant="outlined" size="small" startIcon={<CloudUploadIcon />}>
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImageFile(file);
                      setLocalPreview(URL.createObjectURL(file));
                    }}
                  />
                </Button>
              </Box>
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('name')}
                label="Category Name"
                fullWidth
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('description')}
                label="Description"
                fullWidth
                multiline
                minRows={2}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...register('sortOrder')}
                label="Sort Order"
                type="number"
                fullWidth
                error={!!errors.sortOrder}
                helperText={errors.sortOrder?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={control}
                name="enabled"
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Enabled"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={busy} sx={{ minWidth: 120 }}>
            {busy ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </Box>
    </>
  );
}

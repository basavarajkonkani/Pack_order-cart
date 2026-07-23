import { z } from 'zod';

export const stockSizeSchema = z.object({
  code: z.string().trim().min(1, 'Size code is required'),
  label: z.string().trim().min(1, 'Dimensions are required'),
  weight: z.string().trim().min(1, 'Weight is required'),
  pricePerPiece: z.coerce.number().positive('Price must be greater than 0'),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required'),
  desc: z.string().trim().min(10, 'Description should be at least 10 characters'),
  categoryId: z.string().trim().optional(),
  size: z.enum(['Small', 'Medium', 'Large']),
  micron: z.coerce.number().int().positive('Micron must be a positive number'),
  material: z.string().trim().min(1, 'Material is required'),
  sealing: z.string().trim().min(1, 'Sealing type is required'),
  heatResistance: z.string().trim().min(1, 'Heat resistance is required'),
  moq: z.coerce.number().int().positive('MOQ must be a positive number'),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  inStock: z.boolean(),
  visible: z.boolean(),
  sizes: z.array(stockSizeSchema).min(1, 'Add at least one size/price tier'),
});

/** Raw shape as entered in form fields (before zod's coerce.number() runs). */
export type ProductFormInput = z.input<typeof productFormSchema>;
/** Shape after validation/coercion — what gets submitted to Firestore. */
export type ProductFormValues = z.output<typeof productFormSchema>;

export const emptyProductForm: ProductFormInput = {
  name: '',
  desc: '',
  categoryId: '',
  size: 'Medium',
  micron: 100,
  material: '',
  sealing: '',
  heatResistance: '',
  moq: 100,
  discountPercent: 0,
  inStock: true,
  visible: true,
  sizes: [{ code: '', label: '', weight: '', pricePerPiece: 0 }],
};

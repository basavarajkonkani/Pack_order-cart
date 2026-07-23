import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Category name is required'),
  description: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  enabled: z.boolean(),
});

export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type CategoryFormValues = z.output<typeof categoryFormSchema>;

export const emptyCategoryForm: CategoryFormInput = {
  name: '',
  description: '',
  sortOrder: 0,
  enabled: true,
};

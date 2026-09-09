import { z } from 'zod';

export const businessFormSchema = z.object({
  gstin: z.string().trim().min(15, 'Valid GSTIN is required (15 characters)').max(15),
  businessName: z.string().trim().min(1, 'Business name is required'),
  legalName: z.string().trim().min(1, 'Legal name is required'),
  address: z.string().trim().min(1, 'Address is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  pincode: z.string().trim().min(6, 'Valid pincode is required').max(6),
  gstPercentage: z.coerce.number().min(0).max(100),
});

export type BusinessFormInput = z.input<typeof businessFormSchema>;
export type BusinessFormValues = z.output<typeof businessFormSchema>;

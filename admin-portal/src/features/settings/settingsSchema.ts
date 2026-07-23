import { z } from 'zod';

export const settingsFormSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required'),
  companyEmail: z.string().trim().email('Enter a valid email').or(z.literal('')).optional(),
  companyPhone: z.string().trim().optional(),
  companyAddress: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
  taxPercent: z.coerce.number().min(0).max(100),
  shippingFlatRate: z.coerce.number().min(0),
  freeShippingThreshold: z.coerce.number().min(0).optional(),
  paymentMethods: z.object({
    upi: z.boolean(),
    bankTransfer: z.boolean(),
    creditTerms: z.boolean(),
  }),
});

export type SettingsFormInput = z.input<typeof settingsFormSchema>;
export type SettingsFormValues = z.output<typeof settingsFormSchema>;

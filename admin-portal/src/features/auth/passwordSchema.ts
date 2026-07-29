import { z } from 'zod';

/** Firebase Auth's own floor is 6 characters; anything shorter is rejected
 *  server-side with auth/weak-password, so validate it before the round trip. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Re-enter the new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one',
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

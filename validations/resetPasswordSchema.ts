import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[\W_]/, 'Password must contain at least one special character')
    .regex(/^\S*$/, 'Password cannot contain spaces')
    .regex(
      /^[A-Za-z0-9!@#$%^&*(),.?":{}|<>]*$/,
      'Password contains invalid characters'
    ),
  reset_password_token: z.string(),
});

export default resetPasswordSchema;

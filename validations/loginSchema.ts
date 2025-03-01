import { z } from 'zod';

const loginSchema = z
  .object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string(),
  })
  .refine((data) => data.username || data.email, {
    message: 'Either username or email must be provided.',
    path: ['username', 'email'], // Specify the path of the error
  });


export default loginSchema;

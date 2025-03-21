import { z } from 'zod';

const getUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  id: z.string().optional(),

  page: z
    .string()
    .refine((value) => !isNaN(Number(value)), {
      message: 'skip must be a numeric string',
    })
    .optional(),
  limit: z
    .string()
    .refine((value) => !isNaN(Number(value)), {
      message: 'skip must be a numeric string',
    })
    .optional(),
});

export default getUserSchema;

import { z } from 'zod';

const findUserSchema = z.object({
  user: z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    id: z.string().optional(),
  }),
});

export default findUserSchema;

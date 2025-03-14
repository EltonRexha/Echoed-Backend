import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(20).max(280),
  tags: z.array(z.string()),
});

export default createPostSchema;

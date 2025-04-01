import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(20).max(280),
  tags: z.array(z.string()).max(10),
  mainPostId: z.string().optional(),
});

export default createPostSchema;

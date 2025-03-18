import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(20).max(280),
  parentCommentId: z.string().optional()
});

export default commentSchema;

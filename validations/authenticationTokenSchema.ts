import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  OAuth: z.boolean().optional(),
  access: z.boolean().optional(),
  refresh: z.boolean().optional(),
});

const ParsedTokenSchema = z.object({
  exp: z.number(),
  user: UserSchema,
});

export default ParsedTokenSchema;

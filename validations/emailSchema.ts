import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email(),
});

export default emailSchema; 

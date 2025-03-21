import { z } from 'zod';

const getPostSchema = z
  .object({
    id: z.string().optional(),
    authorId: z.string().optional(),
    authorEmail: z.string().email().optional(),
    authorUsername: z.string().optional(),
    likedByUserId: z.string().optional(),
    savedByUserId: z.string().optional(),
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
  })
  .refine(
    (data) =>
      Object.keys(data).some(function <Key extends keyof typeof data>(
        key: string
      ) {
        return (
          key !== 'page' && key !== 'limit' && data[key as Key] !== undefined
        );
      }),
    {
      message:
        'At least one of the following fields must be provided: id, authorId, userEmail, likedByUserId, savedByUserId',
      path: [],
    }
  );

export default getPostSchema;

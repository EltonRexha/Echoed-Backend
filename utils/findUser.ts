import { prisma } from '../db/client';
import { User } from '../types/user';

/**
 * It returns a promise where the first item is a local user
 * and the second item is a google user 
 */
export default async function (
  username?: string,
  email?: string,
  id?: string
) {
  return await Promise.all([
    prisma.user.findUnique({
      where: {
        username,
        email,
        id,
      },
    }),
    prisma.googleUser.findUnique({
      where: {
        email,
        id,
      },
    }),
  ]);
}

import { prisma } from '../db/client';

/**
 * It returns a promise where the first item is a local user
 * and the second item is a google user
 */
export default async function (username?: string, email?: string, id?: string) {
  return await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }, { id }],
      },
    }),
    prisma.googleUser.findFirst({
      where: {
        OR: [{ email }, { id }],
      },
    }),
  ]);
}

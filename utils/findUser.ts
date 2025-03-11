import { prisma } from '../db/client';

/**
 * It returns a promise where the first item is a local user
 * and the second item is a google user
 */
export default async function (username?: string, email?: string, id?: string) {
  return await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [{ username: username?.toLowerCase() }, { email: email?.toLowerCase() }, { id }],
      },
    }),
    prisma.googleUser.findFirst({
      where: {
        OR: [{ email: email?.toLowerCase() }, { id }],
      },
    }),
  ]);
}

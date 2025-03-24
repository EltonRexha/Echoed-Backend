import { prisma } from '../db/client';

/**
 * @param userId the user who got blocked
 * @param fromUserId the user who is blocking
 * @returns if first user is blocked by second user
 */
export default async function UserIsBlocked(
  userId: string,
  fromUserId: string
) {
  const prismaUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      blockedBy: true,
    },
  });

  if (!prismaUser) {
    return false;
  }

  return prismaUser.blockedBy.some(
    (blockedByUser) => blockedByUser.id === fromUserId
  );
}

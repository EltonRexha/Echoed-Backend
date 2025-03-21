import { prisma } from '../db/client';

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

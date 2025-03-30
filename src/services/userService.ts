import { Gender, Prisma, Roles, User, UserInfo } from '@prisma/client';
import { prisma } from '../db/client';

export namespace userService {
  export async function getLocalUser({
    username,
    email,
    id,
  }: {
    username?: string;
    email?: string;
    id?: string;
  }) {
    const user = await prisma.user.findFirst({
      where: {
        ...(username && {
          username: { contains: username, mode: 'insensitive' },
        }),
        ...(email && { email: { contains: email, mode: 'insensitive' } }),
        ...(id && { id: id }),
      },
      include: {
        ProfileImage: true,
        UserInfo: true,
      },
    });

    return user;
  }

  export async function createLocalUser({
    firstName,
    lastName,
    email,
    username,
    country,
    dateOfBirth,
    gender,
    password = null,
    githubUserId,
    googleUserId,
    roles,
    verified = false,
  }: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    country: string;
    dateOfBirth: Date;
    gender: Gender;
    password?: string | null;
    githubUserId?: string;
    googleUserId?: string;
    verified?: boolean;
    roles?: Roles[];
  }) {
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username,
        password,
        ...(roles && { Role: roles }),
        UserInfo: {
          create: {
            country,
            dateOfBirth,
            gender,
          },
        },
        ...(githubUserId && {
          githubUser: {
            connect: {
              githubUserId,
            },
          },
        }),
        ...(googleUserId && {
          googleUser: {
            connect: {
              googleUserId,
            },
          },
        }),

        verified,
      },
    });

    return user;
  }

  export async function getUsers({
    username,
    email,
    id,
    page = 1,
    limit = 10,
  }: {
    username?: string;
    email?: string;
    id?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
        email: {
          equals: email,
          mode: 'insensitive',
        },
        id: id,
      },
      select: {
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        ProfileImage: true,
      },
      skip,
      take: limit,
    });

    return users;
  }

  export async function getGoogleUser({
    googleUserId,
    id,
    email,
  }: {
    googleUserId?: string;
    id?: string;
    email?: string;
    options?: Omit<Prisma.GoogleUserFindFirstArgs, 'where'>;
  }) {
    const user = await prisma.googleUser.findFirst({
      where: {
        ...(email && { email: { contains: email, mode: 'insensitive' } }),
        ...(googleUserId && { googleUserId }),
        ...(id && { id }),
      },
    });

    return user;
  }

  export async function getGithubUser({
    githubUserId,
    id,
  }: {
    githubUserId?: string;
    id?: string;
  }) {
    const user = await prisma.githubUser.findFirst({
      where: {
        ...(githubUserId && { githubUserId: githubUserId }),
        ...(githubUserId && { githubUserId: githubUserId }),
        ...(id && { id }),
      },
    });

    return user;
  }

  export async function getGoogleUserAndLocalUser({
    googleUserId,
    id,
    email,
  }: {
    googleUserId?: string;
    id?: string;
    email?: string;
    options?: Omit<Prisma.GoogleUserFindFirstArgs, 'where'>;
  }) {
    const user = await prisma.googleUser.findFirst({
      where: {
        ...(email && { email: { contains: email, mode: 'insensitive' } }),
        ...(googleUserId && { googleUserId }),
        ...(id && { id }),
      },
      include: {
        user: true,
      },
    });

    return user;
  }

  export async function getGithubUserAndLocalUser({
    githubUserId,
    id,
  }: {
    githubUserId?: string;
    id?: string;
  }) {
    const user = await prisma.githubUser.findFirst({
      where: {
        ...(githubUserId && { githubUserId: githubUserId }),
        ...(githubUserId && { githubUserId: githubUserId }),
        ...(id && { id }),
      },
      include: {
        user: true,
      },
    });

    return user;
  }

  export async function verifyUser({ userId }: { userId: string }) {
    return await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        verified: true,
      },
    });
  }

  /**
   * @param userId the user who got blocked
   * @param fromUserId the user who is blocking
   * @returns if first user is blocked by second user
   */
  export async function UserIsBlocked(userId: string, fromUserId: string) {
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
}

import { UserType } from '@prisma/client';
import { prisma } from '../../db/client';
import { User } from '../../types/user';
import createJWT from './createJWT';

export default async function (user: User): Promise<string> {
  const token = createJWT({ ...user, refresh: true }, 7, 'd');

  if (user.UserType === UserType.local) {
    await prisma.refreshTokens.upsert({
      where: {
        token,
      },
      update: {},
      create: {
        token,
        revoked: false,
      },
    });
  }

  if (user.UserType === UserType.github) {
    await prisma.refreshTokens.upsert({
      where: {
        token,
      },
      update: {},
      create: {
        token,
        revoked: false,
        GithubUser: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  }

  if (user.UserType === UserType.google) {
    await prisma.refreshTokens.upsert({
      where: {
        token,
      },
      update: {},
      create: {
        token,
        revoked: false,
        GoogleUser: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  }

  return token;
}

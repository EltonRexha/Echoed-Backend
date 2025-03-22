import { UserType } from '@prisma/client';
import { prisma } from '../db/client';
import { User } from '../types/user';

export namespace refreshTokenService {
  export async function getRefreshToken({ token }: { token: string }) {
    const refreshToken = await prisma.refreshTokens.findUnique({
      where: {
        token,
      },
    });

    return refreshToken;
  }

  /**Creates a refresh token or returns a refresh token if it exists */
  export async function createRefreshToken({
    token,
    user,
  }: {
    token: string;
    user: User;
  }) {
    if (user.UserType === UserType.local) {
      return await prisma.refreshTokens.upsert({
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
      return await prisma.refreshTokens.upsert({
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
      return await prisma.refreshTokens.upsert({
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
  }
}

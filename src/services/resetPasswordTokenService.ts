import { addMinutes } from 'date-fns';
import { prisma } from '../db/client';

const RESET_PASSWORD_TOKEN_DURATION_MINUTES = parseInt(
  process.env.RESET_PASSWORD_TOKEN_DURATION_MINUTES as string
);

export namespace resetPasswordTokenService {
  export async function createResetPasswordToken({
    userId,
  }: {
    userId: string;
  }) {
    const verificationToken = await prisma.resetPasswordToken.create({
      data: {
        expiresAt: addMinutes(
          new Date(),
          RESET_PASSWORD_TOKEN_DURATION_MINUTES
        ),
        User: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return verificationToken;
  }

  export async function getResetPasswordToken({ token }: { token: string }) {
    const foundToken = await prisma.resetPasswordToken.findUnique({
      where: {
        token,
      },
      include: {
        User: true,
      },
    });

    return foundToken;
  }

  export async function getFreshResetPasswordTokens({
    userId,
  }: {
    userId: string;
  }) {
    const tokens = await prisma.resetPasswordToken.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
        User: {
          id: userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tokens;
  }
}

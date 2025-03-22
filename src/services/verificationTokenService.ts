import { addMinutes } from 'date-fns';
import { prisma } from '../db/client';

const EMAIL_VERIFICATION_TOKEN_MINUTES = parseInt(
  process.env.EMAIL_VERIFICATION_TOKEN_DURATION_MINUTES as string
);

export namespace verificationTokenService {
  export async function createUserVerificationToken({
    userId,
  }: {
    userId: string;
  }) {
    const verificationToken = await prisma.userVerificationToken.create({
      data: {
        expiresAt: addMinutes(new Date(), EMAIL_VERIFICATION_TOKEN_MINUTES),
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return verificationToken;
  }

  export async function getVerificationToken({ token }: { token: string }) {
    const foundToken = await prisma.userVerificationToken.findUnique({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });

    return foundToken;
  }

  export async function getFreshVerificationTokens({
    userId,
  }: {
    userId: string;
  }) {
    const tokens = await prisma.userVerificationToken.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
        user: {
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

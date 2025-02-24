import { NextFunction, Response, Request } from 'express';
import { prisma } from '../db/client';
import notFoundError from '../errors/errorTypes/notFoundError';
import { addMinutes, isAfter, subMinutes } from 'date-fns';
import manyRequestsError from '../errors/errorTypes/manyRequestsError';
import createJWT from '../utils/createJWT';
import sendVerifyEmail from '../utils/sendVerifyMail';
import goneError from '../errors/errorTypes/goneError';
import conflictError from '../errors/errorTypes/conflictError';
import { userVerificationToken } from '@prisma/client';

const EMAIL_VERIFICATION_TOKEN_MINUTES = parseInt(
  process.env.EMAIL_VERIFICATION_TOKEN_DURATION_MINUTES as string
);

export async function sendVerificationEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { email }: { email: string | undefined } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user || user.verified) {
    next(notFoundError('User not found'));
    return;
  }

  const now = new Date();

  //Get a tokens from newest to oldest
  const existingVerificationTokens =
    await prisma.userVerificationToken.findMany({
      where: {
        expiresAt: {
          gt: now,
        },
        user: {
          id: user.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

  const newestStoredVerificationToken = existingVerificationTokens[0] as
    | userVerificationToken
    | undefined;

  const EMAIL_TIMEOUT = subMinutes(
    new Date(),
    parseInt(process.env.EMAIL_VERIFICATION_RESEND_TOKEN_TIMEOUT as string)
  );

  // If a token was created some minutes ago and more
  // than one tokens were created then don't send email to prevent spams
  if (newestStoredVerificationToken) {
    if (
      isAfter(newestStoredVerificationToken.createdAt, EMAIL_TIMEOUT) &&
      existingVerificationTokens.length > 1
    ) {
      next(manyRequestsError());
      return;
    }
  }

  const verificationToken = createJWT(user, EMAIL_VERIFICATION_TOKEN_MINUTES);

  await prisma.userVerificationToken.create({
    data: {
      expiresAt: addMinutes(new Date(), EMAIL_VERIFICATION_TOKEN_MINUTES),
      token: verificationToken,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  sendVerifyEmail(user.email, verificationToken, user);
  res.status(200).json({
    message: 'successfully send email',
  });
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { token }: { token: string | undefined } = req.body;

  const verificationToken = await prisma.userVerificationToken.findUnique({
    where: {
      token: token,
    },
  });

  if (!verificationToken) {
    next(notFoundError('Token not found'));
    return;
  }

  const now = new Date();

  if (isAfter(now, verificationToken.expiresAt)) {
    next(goneError('Token expired'));
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      userVerificationToken: {
        some: {
          token,
        },
      },
    },
  });

  if (!user) {
    next(notFoundError('Token not found'));
    return;
  }

  if (user.verified) {
    next(conflictError('Email already verified'));
    return;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      verified: true,
    },
  });

  res.status(200).json({
    message: 'User successfully verified',
  });
}

import { NextFunction, Response, Request } from 'express';
import { prisma } from '../db/client';
import notFoundError from '../errors/errorTypes/notFoundError';
import { addMinutes, isAfter, subMinutes } from 'date-fns';
import manyRequestsError from '../errors/errorTypes/manyRequestsError';
import createJWT from '../utils/createJWT';
import sendVerifyEmail from '../utils/sendVerifyMail';
import goneError from '../errors/errorTypes/goneError';
import conflictError from '../errors/errorTypes/conflictError';
import { resetPasswordToken, userVerificationToken } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { zodError } from '../errors/errors';
import { z } from 'zod';
import sendResetPasswordEmail from '../utils/sendResetPasswordMail';
import findUserSchema from '../validations/findUserSchema';

const EMAIL_VERIFICATION_TOKEN_MINUTES = parseInt(
  process.env.EMAIL_VERIFICATION_TOKEN_DURATION_MINUTES as string
);

const RESET_PASSWORD_TOKEN_DURATION_MINUTES = parseInt(
  process.env.RESET_PASSWORD_TOKEN_DURATION_MINUTES as string
);

export const sendVerificationEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        user: { email, username, id },
      } = findUserSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: {
          email,
          username,
          id,
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

      const verificationToken = createJWT(
        user,
        EMAIL_VERIFICATION_TOKEN_MINUTES
      );

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
        message: 'successfully send verify user email',
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        next(zodError(e.errors));
        return;
      }
      next(e);
    }
  }
);

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;

    if (typeof token !== 'string') {
      next(notFoundError('Token not found'));
      return;
    }

    const verificationToken = await prisma.userVerificationToken.findUnique({
      where: {
        token: token,
      },
      include: {
        user: true,
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

    const user = verificationToken.user;

    if (!user) {
      next(notFoundError('Token not found'));
      return;
    }

    if (user.verified) {
      next(conflictError('Email already verified', 'EMAIL_VERIFIED'));
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
);

export const sendResetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        user: { email, username, id },
      } = findUserSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: {
          email,
          username,
          id,
        },
      });

      if (!user) {
        next(notFoundError('User not found'));
        return;
      }

      const now = new Date();

      //Get a tokens from newest to oldest
      const existingResetPasswordTokens =
        await prisma.resetPasswordToken.findMany({
          where: {
            expiresAt: {
              gt: now,
            },
            User: {
              id: user.id,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      const newestStoredResetPasswordToken = existingResetPasswordTokens[0] as
        | resetPasswordToken
        | undefined;

      const RESET_PASSWORD_TIMEOUT = subMinutes(
        new Date(),
        parseInt(process.env.RESET_PASSWORD_RESEND_TOKEN_TIMEOUT as string)
      );

      // If a token was created some minutes then don't send email to prevent spams
      if (newestStoredResetPasswordToken) {
        if (
          isAfter(
            newestStoredResetPasswordToken.createdAt,
            RESET_PASSWORD_TIMEOUT
          )
        ) {
          next(manyRequestsError());
          return;
        }
      }

      const resetPasswordToken = createJWT(
        user,
        RESET_PASSWORD_TOKEN_DURATION_MINUTES
      );

      await prisma.resetPasswordToken.create({
        data: {
          expiresAt: addMinutes(
            new Date(),
            RESET_PASSWORD_TOKEN_DURATION_MINUTES
          ),
          token: resetPasswordToken,
          User: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      await sendResetPasswordEmail(user.email, resetPasswordToken);

      res.status(200).json({
        message: 'successfully send reset password email',
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        next(zodError(e.errors));
        return;
      }
      next(e);
    }
  }
);

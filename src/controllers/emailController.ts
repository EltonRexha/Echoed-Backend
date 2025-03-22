import { NextFunction, Response, Request } from 'express';
import notFoundError from '../errors/errorTypes/notFoundError';
import { isAfter, subMinutes } from 'date-fns';
import manyRequestsError from '../errors/errorTypes/manyRequestsError';
import sendVerifyEmail from '../utils/mail/sendVerifyMail';
import goneError from '../errors/errorTypes/goneError';
import conflictError from '../errors/errorTypes/conflictError';
import { resetPasswordToken, userVerificationToken } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import sendResetPasswordEmail from '../utils/mail/sendResetPasswordMail';
import findUserSchema from '../validations/findUserSchema';
import { userService } from '../services/userService';
import { verificationTokenService } from '../services/verificationTokenService';
import { resetPasswordTokenService } from '../services/resetPasswordTokenService';

export const sendVerificationEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { email, username, id },
    } = findUserSchema.parse(req.body);

    const user = await userService.getLocalUser({ email, username, id });

    if (!user || user.verified || !user.email) {
      next(notFoundError('User not found'));
      return;
    }

    //Get a tokens from newest to oldest
    const existingVerificationTokens =
      await verificationTokenService.getFreshVerificationTokens({
        userId: user.id,
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

    const verificationToken =
      await verificationTokenService.createUserVerificationToken({
        userId: user.id,
      });

    sendVerifyEmail(user.email, verificationToken.token, user);
    res.status(200).json({
      message: 'successfully send verify user email',
    });
  }
);

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;

    if (typeof token !== 'string') {
      next(notFoundError('Token not found'));
      return;
    }

    const verificationToken =
      await verificationTokenService.getVerificationToken({ token });

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

    await userService.verifyUser({ userId: user.id });

    res.status(200).json({
      message: 'User successfully verified',
    });
  }
);

export const sendResetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { email, username, id },
    } = findUserSchema.parse(req.body);

    const user = await userService.getLocalUser({ email, username, id });

    if (!user || !user.email) {
      next(notFoundError('User not found'));
      return;
    }

    const now = new Date();

    //Get a tokens from newest to oldest
    const existingResetPasswordTokens =
      await resetPasswordTokenService.getFreshResetPasswordTokens({
        userId: user.id,
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

    const resetPasswordToken =
      await resetPasswordTokenService.createResetPasswordToken({
        userId: user.id,
      });

    await sendResetPasswordEmail(user.email, resetPasswordToken.token);

    res.status(200).json({
      message: 'successfully send reset password email',
    });
  }
);

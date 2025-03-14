import { NextFunction, Request, Response } from 'express';
import createAccessToken from '../utils/createAccessToken';
import createRefreshToken from '../utils/createRefreshToken';
import { User } from '../types/user';
import loginSchema from '../validations/loginSchema';
import authenticationTokenSchema from '../validations/authenticationTokenSchema';
import { z } from 'zod';
import { prisma } from '../db/client';
import bcrypt from 'bcryptjs';
import unautherizedError from '../errors/errorTypes/unautherizedError';
import forbiddenError from '../errors/errorTypes/forbiddenError';
import badRequestError from '../errors/errorTypes/badRequestError';
import notFoundError from '../errors/errorTypes/notFoundError';
import JWT from 'jsonwebtoken';
import tokenExpired from '../utils/tokenExpired';
import asyncHandler from 'express-async-handler';
import resetPasswordSchema from '../validations/resetPasswordSchema';
import { isAfter } from 'date-fns';
import goneError from '../errors/errorTypes/goneError';

const JWT_SECRET = process.env.JWT_SECRET as string;
const FRONTEND_URL = process.env.FRONT_URL as string;

export const sendTokens = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as User;

  const accessToken = createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/api/v1/auth/refresh',
  });

  res.status(200).json({
    message: 'Successfully authenticated',
  });
});

export const login = [
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = loginSchema.parse(req.body);

    //User exists?
    const user = await prisma.user.findUnique({
      where: {
        email: email?.toLowerCase(),
        username: username?.toLowerCase(),
      },
    });

    if (!user) {
      next(unautherizedError('Invalid credentials'));
      return;
    }

    if (!user.password) {
      next(unautherizedError('Please login with your OAuth provider'));
      return;
    }

    const passwordCorrect = await bcrypt.compare(password, user.password);

    if (!passwordCorrect) {
      next(unautherizedError('Invalid credentials'));
      return;
    }

    if (!user.verified) {
      next(
        forbiddenError('Please verify your email', 'EMAIL_NOT_VERIFIED', {
          email: user.email,
        })
      );
      return;
    }

    req.user = user;
    next();
  }),
  sendTokens,
];

export const refreshToken = [
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (
      !req.cookies ||
      !('refresh_token' in req.cookies) ||
      typeof req.cookies.refresh_token !== 'string'
    ) {
      next(badRequestError('Refresh token not provided'));
      return;
    }

    const { refresh_token: token } = req.cookies;

    //Check if the token is valid and not revoked
    const storedToken = await prisma.refreshTokens.findUnique({
      where: {
        token: token,
      },
    });

    if (!storedToken) {
      next(notFoundError('Token not found'));
      return;
    }

    if (storedToken.revoked) {
      next(unautherizedError('Token revoked'));
      return;
    }

    try {
      const parsedToken = JWT.verify(token, JWT_SECRET);
      const {
        exp,
        user: { id: userId, refresh },
      } = authenticationTokenSchema.parse(parsedToken);

      if (!refresh) {
        next(unautherizedError('Invalid token'));
        return;
      }

      //If token expired
      if (tokenExpired(exp)) {
        next(unautherizedError('Token expired'));
        return;
      }

      const [localUser, googleUser, githubUser] = await Promise.all([
        prisma.user.findUnique({
          where: {
            id: userId,
          },
        }),
        prisma.googleUser.findUnique({
          where: {
            id: userId,
          },
        }),
        prisma.githubUser.findUnique({
          where: {
            id: userId,
          },
        }),
      ]);

      const user = localUser || googleUser || githubUser;

      if (!user) {
        next(notFoundError('User not found'));
        return;
      }

      req.user = user;
      next();

      return;
    } catch (e) {
      next(unautherizedError('Invalid token'));
    }
  }),
  sendTokens,
];

export const sendRedirectFront = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as User;

    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user);

    const link = new URL('/home', FRONTEND_URL);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth/refresh',
    });

    res.redirect(link.toString());
  }
);

export const logout = (req: Request, res: Response) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/api/v1/auth/refresh',
  });

  res.status(200).json({ message: 'Logged out successfully' });
};

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reset_password_token: resetPasswordToken, password } =
      resetPasswordSchema.parse(req.body);

    const storedResetPasswordToken = await prisma.resetPasswordToken.findUnique(
      {
        where: {
          token: resetPasswordToken,
        },
        include: {
          User: true,
        },
      }
    );

    if (!storedResetPasswordToken) {
      next(notFoundError('Reset password token not found'));
      return;
    }

    const now = new Date();

    if (isAfter(now, storedResetPasswordToken.expiresAt)) {
      next(goneError('Token expired'));
      return;
    }

    const user = storedResetPasswordToken.User;

    if (!user) {
      next(notFoundError('User not found'));
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.status(200).json({
      message: 'successfully reset password',
    });
  }
);

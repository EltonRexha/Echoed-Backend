import { NextFunction, Request, Response } from 'express';
import createAccessToken from '../utils/createAccessToken';
import createRefreshToken from '../utils/createRefreshToken';
import { User } from '../types/user';
import loginSchema from '../validations/loginSchema';
import { z } from 'zod';
import { internalError, zodError } from '../errors/errors';
import { prisma } from '../db/client';
import bcrypt from 'bcryptjs';
import unautherizedError from '../errors/errorTypes/unautherizedError';
import forbiddenError from '../errors/errorTypes/forbiddenError';

export const login = [
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password } = loginSchema.parse(req.body);

      //User exists?
      const user = await prisma.user.findUnique({
        where: {
          email,
          username,
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
        next(forbiddenError('Please verify your email'));
        return;
      }

      req.user = user;
      next();
    } catch (e) {
      if (e instanceof z.ZodError) {
        next(zodError(e.errors));
        return;
      }
      next(e);
    }
  },
  sendTokens,
];

export async function sendTokens(req: Request, res: Response) {
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
}

const FRONTEND_URL = process.env.FRONT_URL as string;
const TOKENS_ENDPOINT = process.env.SEND_TOKENS_ENDPOINT as string;

export async function sendRedirectFront(req: Request, res: Response) {
  const user = req.user as User;

  const accessToken = createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  const link = new URL(TOKENS_ENDPOINT, FRONTEND_URL);

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

import { NextFunction, Request, Response } from 'express';
import authenticationTokenSchema from '../validations/authenticationTokenSchema';
import JWT from 'jsonwebtoken';
import unauthorizedError from '../errors/errorTypes/unauthorizedError';
import tokenExpired from '../utils/tokenExpired';
import { prisma } from '../db/client';
import notFoundError from '../errors/errorTypes/notFoundError';
import asyncHandler from 'express-async-handler';
import { isLocalUser } from '../types/user';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (
    !req.cookies ||
    !('access_token' in req.cookies) ||
    typeof req.cookies.access_token !== 'string'
  ) {
    next(unauthorizedError('Access token not provided'));
    return;
  }

  const { access_token: token } = req.cookies;

  try {
    const parsedToken = JWT.verify(token, JWT_SECRET);

    const {
      exp,
      user: { id: userId, access },
    } = authenticationTokenSchema.parse(parsedToken);

    //if the token is not a session token
    if (!access) {
      next(unauthorizedError('invalid token'));
      return;
    }

    if (tokenExpired(exp)) {
      next(unauthorizedError('Token expired'));
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

    if (isLocalUser(user) && !user.verified) {
      next(unauthorizedError('User not verified'));
      return;
    }

    req.user = user;
    next();
  } catch (e) {
    next(unauthorizedError('Invalid token'));
  }
});

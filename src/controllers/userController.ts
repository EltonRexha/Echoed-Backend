import { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/client';
import userSchema from '../validations/userSchema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import internalError from '../errors/errorTypes/internalError';
import sendVerifyEmail from '../utils/mail/sendVerifyMail';
import createJWT from '../utils/tokens/createJWT';
import { addMinutes } from 'date-fns';
import getUserSchema from '../validations/getUserSchema';
import findUser from '../utils/findUser';
import badRequestError from '../errors/errorTypes/badRequestError';
import asyncHandler from 'express-async-handler';
import { isGithubUser, isGoogleUser, isLocalUser, User } from '../types/user';
import finishProfileSchema from '../validations/finishProfileSchema';
import notFoundError from '../errors/errorTypes/notFoundError';

const EMAIL_VERIFICATION_TOKEN_MINUTES = parseInt(
  process.env.EMAIL_VERIFICATION_TOKEN_DURATION_MINUTES as string
);

export const getUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = getUserSchema.parse(req.query);
    const username = params.username;
    const email = params.email;
    const id = params.id;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await Promise.all([
      prisma.user.findMany({
        where: {
          username: {
            equals: username,
            mode: 'insensitive',
          },
          email: {
            equals: email,
            mode: 'insensitive',
          },
          id: id,
        },
        select: {
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          ProfileImage: true,
        },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      users,
      page,
    });
  }
);

export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = userSchema.parse({
      ...req.body,
      dateOfBirth: new Date(req.body.dateOfBirth),
    });

    const {
      firstName,
      lastName,
      email,
      password,
      dateOfBirth,
      username,
      country,
      gender,
    } = user;

    const foundUser = await findUser(username, email);
    const [localUser, googleUser] = foundUser;

    const userExists = !!(localUser || googleUser);

    if (userExists) {
      next(badRequestError('User with this email or username already exists'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        password: passwordHash,
        username: username.toLowerCase(),
        verified: false,
        UserInfo: {
          create: {
            country,
            dateOfBirth,
            gender,
          },
        },
      },
    });

    const userVerificationToken = createJWT(
      createdUser,
      EMAIL_VERIFICATION_TOKEN_MINUTES
    );

    await prisma.userVerificationToken.create({
      data: {
        expiresAt: addMinutes(new Date(), EMAIL_VERIFICATION_TOKEN_MINUTES),
        token: userVerificationToken,
        user: {
          connect: {
            id: createdUser.id,
          },
        },
      },
    });

    await sendVerifyEmail(email, userVerificationToken, createdUser);
    res.status(201).json({
      message: 'User successfully created',
    });
  }
);

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;

    if (isLocalUser(user)) {
      const info = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          ProfileImage: true,
          UserInfo: true,
        },
      });

      if (!info) {
        next(internalError('Could not fetch your profile'));
        return;
      }

      res.status(200).json({
        user: {
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: info.ProfileImage?.path,
          gender: info.UserInfo.gender,
          country: info.UserInfo.country,
          dateOfBirth: info.UserInfo.dateOfBirth,
          verified: user.verified,
          UserType: user.UserType,
        },
      });

      return;
    }

    if (isGithubUser(user)) {
      res
        .status(200)
        .json({ user: { ...user, ...{ profileImage: user.profileUrl } } });
      return;
    }

    if (isGoogleUser(user)) {
      res
        .status(200)
        .json({ user: { ...user, ...{ profileImage: user.profileUrl } } });
      return;
    }

    next(internalError('Invalid user type'));
  }
);

export const convertOAuthUserToLocalUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, username, country, dateOfBirth } =
      finishProfileSchema.parse({
        ...req.body,
        dateOfBirth: new Date(req.body.dateOfBirth),
      });

    const user = req.user as User;

    if (isLocalUser(user)) {
      next(badRequestError('Cannot convert a local user to a local user'));
      return;
    }

    if (isGithubUser(user)) {
      //Migrate github user to local user
      const githubUser = await prisma.githubUser.findUnique({
        where: {
          githubUserId: user.githubUserId,
        },
        include: {
          user: true,
        },
      });

      if (!githubUser) {
        next(notFoundError('github user not found'));
        return;
      }

      if (githubUser.user) {
        next(badRequestError('github user already has a local user'));
        return;
      }

      const localUser = await prisma.user.create({
        data: {
          firstName: githubUser.firstName || firstName,
          lastName: githubUser.lastName || lastName,
          email: githubUser.email,
          username: username.toLowerCase(),
          UserInfo: {
            create: {
              country,
              dateOfBirth,
              gender: 'unknown',
            },
          },
          githubUser: {
            connect: {
              githubUserId: user.githubUserId,
            },
          },
          verified: true,
        },
      });
      req.user = localUser;
      next();
      return;
    }

    if (isGoogleUser(user)) {
      //Migrate google user to local user
      const googleUser = await prisma.googleUser.findUnique({
        where: {
          googleUserId: user.googleUserId,
        },
        include: {
          user: true,
        },
      });

      if (!googleUser) {
        next(notFoundError('google user not found'));
        return;
      }

      if (googleUser.user) {
        next(badRequestError('google user already has a local user'));
        return;
      }

      const localUser = await prisma.user.create({
        data: {
          firstName: googleUser.firstName || firstName,
          lastName: googleUser.lastName || lastName,
          email: googleUser.email.toLowerCase(),
          username: username.toLowerCase(),
          UserInfo: {
            create: {
              country,
              dateOfBirth,
              gender: 'unknown',
            },
          },
          googleUser: {
            connect: {
              googleUserId: user.googleUserId,
            },
          },
          verified: true,
        },
      });
      req.user = localUser;
      next();
      return;
    }

    next(internalError());
    return;
  }
);

import { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/client';
import userSchema from '../validations/userSchema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import { internalError, zodError } from '../errors/errors';
import sendVerifyEmail from '../utils/sendVerifyMail';
import createJWT from '../utils/createJWT';
import notFoundError from '../errors/errorTypes/notFoundError';
import { addMinutes, isAfter, subMinutes } from 'date-fns';
import manyRequestsError from '../errors/errorTypes/manyRequestsError';
import badRequestError from '../errors/errorTypes/badRequestError';
import getUserSchema from '../validations/getUserSchema';

const EMAIL_VERIFICATION_TOKEN_MINUTES = parseInt(
  process.env.EMAIL_VERIFICATION_TOKEN_DURATION_MINUTES as string
);

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = getUserSchema.parse(req.params);
    const username = params.username;
    const email = params.email;
    const id = params.id;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: {
          username: username,
          email: email,
          id: id,
        },
        select: {
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      page,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(zodError(e.errors));
      return;
    }
    next(internalError());
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
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

    const userWithEmail = !!(await prisma.user.findUnique({
      where: {
        email: email,
      },
    }));

    const userWithUsername = !!(await prisma.user.findUnique({
      where: {
        username: username,
      },
    }));

    const userExists = userWithEmail || userWithUsername;

    if (userExists) {
      res.status(400).json({
        error: {
          message: 'User with this email or username already exists',
        },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: passwordHash,
        username: username,
        verified: false,
        userCompleted: true,
        userInfo: {
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
  } catch (e) {
    if (e instanceof z.ZodError) {
      next(zodError(e.errors));
      return;
    }
    next(internalError());
  }
}

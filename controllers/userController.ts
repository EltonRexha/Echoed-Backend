import { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/client';
import userSchema from '../validations/userSchema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { zodError } from '../errors/errors';
import sendVerifyEmail from '../utils/sendVerifyMail';
import createJWT from '../utils/createJWT';
import { addMinutes } from 'date-fns';
import getUserSchema from '../validations/getUserSchema';
import findUser from '../utils/findUser';
import badRequestError from '../errors/errorTypes/badRequestError';
import asyncHandler from 'express-async-handler';

const EMAIL_VERIFICATION_TOKEN_MINUTES = parseInt(
  process.env.EMAIL_VERIFICATION_TOKEN_DURATION_MINUTES as string
);

export const getUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
      next(e);
    }
  }
);

export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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

      const foundUser = await findUser(username, email);
      const [localUser, googleUser] = foundUser;

      const userExists = !!(localUser || googleUser);

      if (userExists) {
        next(
          badRequestError('User with this email or username already exists')
        );
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
    } catch (e) {
      if (e instanceof z.ZodError) {
        next(zodError(e.errors));
        return;
      }
      next(e);
    }
  }
);

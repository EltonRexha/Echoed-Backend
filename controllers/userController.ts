import { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/client';
import userSchema from '../validations/userSchema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import sendEmail from '../utils/sendMail';
import { internalError, zodError } from '../errors/errors';
import sendVerifyEmail from '../utils/sendVerifyMail';

export async function getUser(req: Request, res: Response): Promise<void> {
  const params = req.query;
  const username = params.username as string | undefined;
  const email = params.email as string | undefined;
  const id = params.id as string | undefined;

  if (username === undefined && email === undefined && id === undefined) {
    res.json([]);
    return;
  }

  const users = await prisma.user.findMany({
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
  });

  res.json(users);
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
    const userVerificationToken = JWT.sign(
      { user: user },
      process.env.JWT_SECRET as string,
      { expiresIn: '10m' }
    );

    const createdUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: passwordHash,
        username: username,
        verified: false,
        userInfo: {
          create: {
            dateOfBirth,
            gender,
          },
        },
        userVerificationToken: {
          create: {
            token: userVerificationToken,
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
    }
    console.log(e);
    next(internalError());
  }
}

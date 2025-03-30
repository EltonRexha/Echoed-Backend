import { NextFunction, Request, Response } from 'express';
import userSchema from '../validations/userSchema';
import bcrypt from 'bcryptjs';
import internalError from '../errors/errorTypes/internalError';
import sendVerifyEmail from '../utils/mail/sendVerifyMail';
import getUserSchema from '../validations/getUserSchema';
import badRequestError from '../errors/errorTypes/badRequestError';
import asyncHandler from 'express-async-handler';
import { isGithubUser, isGoogleUser, isLocalUser, User } from '../types/user';
import finishProfileSchema from '../validations/finishProfileSchema';
import notFoundError from '../errors/errorTypes/notFoundError';
import { userService } from '../services/userService';
import { verificationTokenService } from '../services/verificationTokenService';

export const getUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = getUserSchema.parse(req.query);
    const username = params.username;
    const email = params.email;
    const id = params.id;
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;

    const users = await userService.getUsers({
      username,
      email,
      id,
      page,
      limit,
    });

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

    const foundUser = await Promise.all([
      userService.getLocalUser({ username, email }),
      userService.getGoogleUser({ email }),
    ]);
    const [localUser, googleUser] = foundUser;

    const userExists = !!(localUser || googleUser);

    if (userExists) {
      next(badRequestError('User with this email or username already exists'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await userService.createLocalUser({
      email: email.toLowerCase(),
      firstName,
      lastName,
      password: passwordHash,
      username: username.toLowerCase(),
      verified: false,
      country,
      dateOfBirth: dateOfBirth,
      gender,
    });

    const verificationToken =
      await verificationTokenService.createUserVerificationToken({
        userId: createdUser.id,
      });

    await sendVerifyEmail(email, verificationToken.token, createdUser);
    res.status(201).json({
      message: 'User successfully created',
    });
  }
);

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;

    if (isLocalUser(user)) {
      const info = await userService.getLocalUser({
        username: user.username,
        email: user.email,
        id: user.id,
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
      const githubUser = await userService.getGithubUserAndLocalUser({
        githubUserId: user.githubUserId,
      });

      if (!githubUser) {
        next(notFoundError('github user not found'));
        return;
      }

      if (githubUser.user) {
        next(badRequestError('github user already has a local user'));
        return;
      }

      const localUser = await userService.createLocalUser({
        firstName: githubUser.firstName || firstName,
        lastName: githubUser.lastName || lastName,
        email: githubUser.email.toLowerCase(),
        username: username.toLowerCase(),
        country,
        dateOfBirth: dateOfBirth,
        gender: 'unknown',
        githubUserId: githubUser.githubUserId,
        verified: true,
      });

      req.user = localUser;
      next();
      return;
    }

    if (isGoogleUser(user)) {
      //Migrate google user to local user
      const googleUser = await userService.getGoogleUserAndLocalUser({
        googleUserId: user.googleUserId,
      });

      if (!googleUser) {
        next(notFoundError('google user not found'));
        return;
      }

      if (googleUser.user) {
        next(badRequestError('google user already has a local user'));
        return;
      }

      const localUser = await userService.createLocalUser({
        firstName: googleUser.firstName || firstName,
        lastName: googleUser.lastName || lastName,
        email: googleUser.email.toLowerCase(),
        username: username.toLowerCase(),
        country,
        dateOfBirth: dateOfBirth,
        gender: 'unknown',
        googleUserId: googleUser.googleUserId,
        verified: true,
      });

      req.user = localUser;
      next();
      return;
    }

    next(internalError());
    return;
  }
);

import { NextFunction, Request, Response } from 'express';
import authenticated from './authenticated';
import { isLocalUser, User } from '../types/user';
import forbiddenError from '../errors/errorTypes/forbiddenError';

export default [
  authenticated,
  function (req: Request, res: Response, next: NextFunction) {
    const user = req.user as User;

    if (!isLocalUser(user)) {
      next(forbiddenError('Please finish setting up your account'));
      return;
    }

    next();
  },
];

import { User } from '@prisma/client';
import { Request, Response } from 'express';
import createAccessToken from '../utils/createAccessToken';
import createRefreshToken from '../utils/createRefreshToken';

export function sendTokens(req: Request, res: Response) {
  const user = req.user as User;

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  res.status(200).json({
    accessToken,
    refreshToken,
  });
}

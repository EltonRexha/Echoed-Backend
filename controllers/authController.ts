import { User } from '@prisma/client';
import { Request, Response } from 'express';
import createAccessToken from '../utils/createAccessToken';
import createRefreshToken from '../utils/createRefreshToken';

export function sendTokens(req: Request, res: Response) {
  const user = req.user as User;

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  res.status(200).json({
    refreshToken,
    accessToken,
  });
}

const FRONTEND_URL = process.env.FRONT_URL as string;
const TOKENS_ENDPOINT = process.env.SEND_TOKENS_ENDPOINT as string;

export function sendTokensWithCookies(req: Request, res: Response) {
  const user = req.user as User;

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  const link = new URL(TOKENS_ENDPOINT, FRONTEND_URL);

  res.cookie('access_token', accessToken, {
    httpOnly: false,
    secure: false,
    sameSite: 'strict',
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: false,
    secure: false,
    sameSite: 'strict',
  });

  res.redirect(link.toString());
}

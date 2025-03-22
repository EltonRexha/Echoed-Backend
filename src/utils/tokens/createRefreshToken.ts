import { UserType } from '@prisma/client';
import { prisma } from '../../db/client';
import { User } from '../../types/user';
import createJWT from './createJWT';
import { refreshTokenService } from '../../services/refreshTokenService';

export default async function (user: User): Promise<string> {
  const token = createJWT({ ...user, refresh: true }, 7, 'd');

  await refreshTokenService.createRefreshToken({ user, token });

  return token;
}

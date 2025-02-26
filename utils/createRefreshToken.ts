import { User } from '@prisma/client';
import createJWT from './createJWT';

export default function (user: User): string {
  return createJWT(user, 7, 'd');
}

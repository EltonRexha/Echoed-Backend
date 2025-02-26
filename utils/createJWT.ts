import { User } from '@prisma/client';
import JWT from 'jsonwebtoken';
import ms from 'ms';

export default function (
  user: User,
  expiresIn: number,
  unit: 'm' | 'h' | 'd' = 'm'
): string {
  const expiresInString = `${expiresIn}${unit}` as ms.StringValue;

  const userVerificationToken = JWT.sign(
    {
      user: {
        id: user.id,
      },
    },
    process.env.JWT_SECRET as string,
    { expiresIn: expiresInString }
  );

  return userVerificationToken;
}

import { User } from '@prisma/client';
import JWT from 'jsonwebtoken';

export default function (user: User, expiresInMinutes: number): string {
  const userVerificationToken = JWT.sign(
    {
      user: {
        id: user.id,
      },
    },
    process.env.JWT_SECRET as string,
    { expiresIn: `${expiresInMinutes}m` }
  );

  return userVerificationToken;
}

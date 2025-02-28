import JWT from 'jsonwebtoken';
import ms from 'ms';

export default function (
  user: { id: string; OAuth?: boolean },
  expiresIn: number,
  unit: 'm' | 'h' | 'd' = 'm'
): string {
  const expiresInString = `${expiresIn}${unit}` as ms.StringValue;

  const userVerificationToken = JWT.sign(
    {
      user: {
        id: user.id,
        OAuth: !!user.OAuth,
      },
    },
    process.env.JWT_SECRET as string,
    { expiresIn: expiresInString }
  );

  return userVerificationToken;
}

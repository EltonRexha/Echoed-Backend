import JWT from 'jsonwebtoken';
import ms from 'ms';

export default function (
  //Id -> userId, OAuth -> Authentiacted with OAuth, access -> its a access token
  user: { id: string; OAuth?: boolean; access?: boolean },
  expiresIn: number,
  unit: 'm' | 'h' | 'd' = 'm'
): string {
  const expiresInString = `${expiresIn}${unit}` as ms.StringValue;

  const userVerificationToken = JWT.sign(
    {
      user: {
        id: user.id,
        OAuth: !!user.OAuth,
        access: !!user.access,
      },
    },
    process.env.JWT_SECRET as string,
    { expiresIn: expiresInString }
  );

  return userVerificationToken;
}

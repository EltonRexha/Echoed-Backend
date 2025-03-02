import { fromUnixTime, isBefore } from 'date-fns';

function tokenExpired(exp: number) {
  const tokenExpirationDate = fromUnixTime(exp);
  const now = new Date();

  return isBefore(tokenExpirationDate, now);
}

export default tokenExpired;

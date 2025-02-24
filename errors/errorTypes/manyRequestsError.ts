import CustomError from '../customError';

export default function (): CustomError {
  return new CustomError(429, {
    error: 'You have made too many requests. Please try again later.',
  });
}

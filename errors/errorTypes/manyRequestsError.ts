import CustomError from '../customError';

export default function (): CustomError {
  return new CustomError(429, {
    error: 'too many requests. Please try again later.',
  });
}

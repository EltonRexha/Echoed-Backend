import CustomError from '../customError';

export default function (details?: Record<string, any>): CustomError {
  return new CustomError(429, {
    error: {
      message: 'Too many requests please try again later',
      details
    },
  });
}

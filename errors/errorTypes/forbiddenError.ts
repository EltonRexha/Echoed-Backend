import CustomError from '../customError';

export default function (message: string): CustomError {
  return new CustomError(403, {
    error: message,
  });
}

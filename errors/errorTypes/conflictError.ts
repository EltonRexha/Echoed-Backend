import CustomError from '../customError';

export default function (message: string): CustomError {
  return new CustomError(410, {
    error: message,
  });
}

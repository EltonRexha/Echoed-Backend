import CustomError from '../customError';

export default function (message: string = 'Not Found'): CustomError {
  return new CustomError(404, {
    error: message,
  });
}

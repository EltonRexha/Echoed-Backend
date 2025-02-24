import CustomError from '../customError';

export default function (message: string = 'Gone'): CustomError {
  return new CustomError(410, {
    error: message,
  });
}

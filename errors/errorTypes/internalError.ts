import CustomError from '../customError';

export default function (): CustomError {
  return new CustomError(500, {
    error: 'Internal server error',
  });
}

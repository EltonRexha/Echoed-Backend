import CustomError from '../customError';

export default function (): CustomError {
  return new CustomError(500, 'Internal server error');
}

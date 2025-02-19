import CustomError from '../customError';

export default function (): Error {
  return new CustomError(500, 'Internal server error');
}

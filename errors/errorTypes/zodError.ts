import { ZodIssue } from 'zod';
import CustomError from '../customError';

export default function (errors: ZodIssue[]): Error {
  return new CustomError(400, JSON.stringify(errors));
}

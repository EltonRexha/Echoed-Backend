import { ZodIssue } from 'zod';
import ZodError from '../zodError';

export default function (errors: ZodIssue[]): ZodError {
  return new ZodError(400, { error: errors });
}

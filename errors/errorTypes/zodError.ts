import { ZodIssue } from 'zod';
import ZodError from '../ZodError';

export default function (errors: ZodIssue[]): ZodError {
  return new ZodError(400, { error: errors });
}

import { ZodIssue } from 'zod';

interface JsonError {
  error: ZodIssue[];
}

export default class ZodError extends Error {
  constructor(public code: number, public jsonError: JsonError) {
    super(JSON.stringify(jsonError));
  }
}

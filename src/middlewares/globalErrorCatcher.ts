import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import customZodError from '../errors/ZodError';
import zodError from '../errors/errorTypes/zodError';
import CustomError from '../errors/customError';
import internalError from '../errors/errorTypes/internalError';

export default (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ZodError) {
    const error = zodError(err.errors);
    res.status(error.code).json(error.jsonError);
    return;
  }
  if (err instanceof CustomError || err instanceof customZodError) {
    res.status(err.code).json(err.jsonError);
    return;
  }

  console.log(err);

  const internal = internalError();
  res.status(internal.code).json(internal.jsonError);
};

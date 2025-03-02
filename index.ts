import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import cors from 'cors';
import CustomError from './errors/customError';
import { internalError } from './errors/errors';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.FRONT_URL,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1', apiRouter);

const PORT = process.env.PORT || 3000;

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    res.status(err.code).json(err.jsonError);
    return;
  }

  console.log(err);

  const internal = internalError();
  res.status(internal.code).json(internal.jsonError);
});

app.listen(PORT, async () => {
  console.log(`Application is running on port ${PORT}`);
});

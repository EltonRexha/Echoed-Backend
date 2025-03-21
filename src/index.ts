import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

import express, { NextFunction, Request, Response } from 'express';
import apiRouter from './routes/apiRouter';
import cors from 'cors';
import CustomError from './errors/customError';
import cookieParser from 'cookie-parser';
import ZodError from './errors/ZodError';
import { z } from 'zod';
import internalError from './errors/errorTypes/internalError';
import zodError from './errors/errorTypes/zodError';
import cloudinaryConfig from './config/cloudinary';
import globalErrorCatcher from './middlewares/globalErrorCatcher';

cloudinaryConfig();
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

app.use(globalErrorCatcher);

app.listen(PORT, async () => {
  console.log(`Application is running on port ${PORT}`);
});

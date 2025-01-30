import express from 'express';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());
app.use('/api/v1/', apiRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Application is running on port ${PORT}`);
});

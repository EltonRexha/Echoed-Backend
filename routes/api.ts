import { Request, Response } from 'express';
import { Router } from 'express';
const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello world',
  });
});

export default router;

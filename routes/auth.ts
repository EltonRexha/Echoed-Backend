import { Router } from 'express';
import { getUser } from '../controllers/authController';
const router = Router();

router.get('/user', getUser);

export default router;

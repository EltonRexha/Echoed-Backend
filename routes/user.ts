import { Router } from 'express';
import { getUsers } from '../controllers/userController';
const router = Router();

router.get('/user', getUsers);

export default router;

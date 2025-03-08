import { Router } from 'express';
import { createUser, getCurrentUser, getUsers } from '../controllers/userController';
import authenticated from '../middlewares/authenticated';
const router = Router();

router.post('/', createUser);
router.get('/', getUsers);
router.get('/me', authenticated, getCurrentUser);

export default router;

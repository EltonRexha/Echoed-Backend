import { Router } from 'express';
import {
  convertOAuthUserToLocalUser,
  createUser,
  getCurrentUser,
  getUsers,
} from '../controllers/userController';
import authenticated from '../middlewares/authenticated';
import { sendTokens } from '../controllers/authController';
const router = Router();

router.post('/', createUser);
router.post('/oauth', authenticated, convertOAuthUserToLocalUser, sendTokens);
router.get('/', getUsers);
router.get('/me', authenticated, getCurrentUser);

export default router;

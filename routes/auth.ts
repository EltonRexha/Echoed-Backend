import { Router } from 'express';
import { createUser } from '../controllers/userController';
import {
  sendVerificationEmail,
  verifyEmail,
} from '../controllers/emailController';
import '../config/passport';
import OAuthRouter from './oAuth';
import { login } from '../controllers/authController';

const router = Router();

router.post('/user', createUser);
router.post('/user/email/verification', sendVerificationEmail);
router.post('/user/email/verify', verifyEmail);
router.post('/login', login);
router.use(OAuthRouter);

export default router;

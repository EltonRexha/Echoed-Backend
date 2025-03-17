import { Router } from 'express';
import {
  sendResetPassword,
  sendVerificationEmail,
  verifyEmail,
} from '../controllers/emailController';
import '../config/passport';
import OAuthRouter from './oAuthRouter';
import {
  login,
  logout,
  refreshToken,
  resetPassword,
} from '../controllers/authController';
import authenticate from '../middlewares/authenticated';

const router = Router();

router.post('/user/email/verification', sendVerificationEmail);
router.post('/user/email/verify', verifyEmail);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/user/email/send-reset-password', sendResetPassword);
router.put('/user/reset-password', resetPassword);
router.use(OAuthRouter);

export default router;

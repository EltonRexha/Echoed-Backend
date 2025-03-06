import { Router } from 'express';
import { createUser } from '../controllers/userController';
import {
  sendResetPassword,
  sendVerificationEmail,
  verifyEmail,
} from '../controllers/emailController';
import '../config/passport';
import OAuthRouter from './oAuth';
import { login, logout, refreshToken, resetPassword } from '../controllers/authController';
import authenticate from '../middlewares/authenticate';

const router = Router();

router.post('/user', createUser);
router.post('/user/email/verification', sendVerificationEmail);
router.post('/user/email/verify', verifyEmail);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/user/email/send-reset-password', sendResetPassword);
router.put('/user/reset-password', resetPassword);
router.get('/protected', authenticate, (req, res) => {
  console.log(req.user);
  res.status(200).json({
    message: 'Authenticated',
  });
});
router.use(OAuthRouter);

export default router;

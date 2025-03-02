import { Router } from 'express';
import { createUser } from '../controllers/userController';
import {
  sendVerificationEmail,
  verifyEmail,
} from '../controllers/emailController';
import '../config/passport';
import OAuthRouter from './oAuth';
import { login, refreshToken } from '../controllers/authController';
import authenticate from '../middlewares/authenticate';

const router = Router();

router.post('/user', createUser);
router.post('/user/email/verification', sendVerificationEmail);
router.post('/user/email/verify', verifyEmail);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/protected', authenticate, (req, res) => {
  console.log(req.user);
  res.status(200).json({
    message: 'Authenticated',
  });
});
router.use(OAuthRouter);

export default router;

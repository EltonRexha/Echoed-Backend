import { Router } from 'express';
import {
  createUser,
} from '../controllers/userController';
import { sendVerificationEmail, verifyEmail } from '../controllers/emailController';
const router = Router();

router.post('/user', createUser);
router.post('/user/email/verification', sendVerificationEmail);
router.post('/user/email/verify', verifyEmail);

export default router;

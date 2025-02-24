import { Router } from 'express';
import {
  createUser,
  sendVerificationEmail,
} from '../controllers/userController';
const router = Router();

router.post('/user', createUser);
router.post('/user/email/verification', sendVerificationEmail);

export default router;

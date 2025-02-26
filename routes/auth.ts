import { Router } from 'express';
import { createUser } from '../controllers/userController';
import {
  sendVerificationEmail,
  verifyEmail,
} from '../controllers/emailController';
import passport from 'passport';
import '../config/passport';
import unautherizedError from '../errors/errorTypes/unautherizedError';
import createJWT from '../utils/createJWT';
import { sendTokens } from '../controllers/authController';

const router = Router();

router.post('/user', createUser);
router.post('/user/email/verification', sendVerificationEmail);
router.post('/user/email/verify', verifyEmail);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/redirect',
  passport.authenticate('google', { failureRedirect: '/google/failed' }),
  sendTokens
);

router.get('/google/failed', (req, res, next) => {
  next(unautherizedError('Could not authenticate with google'));
});

export default router;

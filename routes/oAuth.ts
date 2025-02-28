import passport from 'passport';
import '../config/passport';
import { sendRedirectFront } from '../controllers/authController';
import { Router } from 'express';

const router = Router();

const SEND_OAUTH_ERROR_ENDPOINT = process.env
  .SEND_OAUTH_ERROR_ENDPOINT as string;
const FRONTEND_URL = process.env.FRONT_URL as string;
const FAILURE_REDIRECT = new URL(SEND_OAUTH_ERROR_ENDPOINT, FRONTEND_URL);

router.get(
  '/google',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/redirect',
  passport.authenticate('google', {
    failureRedirect: FAILURE_REDIRECT.toString(),
    session: false,
  }),
  sendRedirectFront
);

router.get(
  '/github',
  passport.authenticate('github', {
    failureRedirect: FAILURE_REDIRECT.toString(),
    session: false,
  })
);

router.get(
  '/github/redirect',
  passport.authenticate('github', {
    session: false,
  }),
  sendRedirectFront
);

export default router;

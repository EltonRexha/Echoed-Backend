import { NextFunction, Request, Response, Router } from 'express';
import passport from 'passport';
import '../config/passport';
import { sendRedirectFront } from '../controllers/authController';

const router = Router();

const SEND_OAUTH_ERROR_ENDPOINT = process.env
  .SEND_OAUTH_ERROR_ENDPOINT as string;
const FRONTEND_URL = process.env.FRONT_URL as string;
const FAILURE_REDIRECT = new URL(
  SEND_OAUTH_ERROR_ENDPOINT,
  FRONTEND_URL
).toString();

router.get(
  '/google',
  passport.authenticate('google', {
    failureRedirect: FAILURE_REDIRECT,
    session: false,
  })
);

router.get(
  '/google/redirect',
  passport.authenticate('google', {
    failureRedirect: FAILURE_REDIRECT,
    session: false,
  }),
  sendRedirectFront
);

router.get(
  '/github',
  passport.authenticate('github', {
    failureRedirect: FAILURE_REDIRECT,
    session: false,
  })
);

router.get(
  '/github/redirect',
  passport.authenticate('github', {
    failureRedirect: FAILURE_REDIRECT,
    session: false,
  }),
  sendRedirectFront
);

router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorRedirect = new URL(FAILURE_REDIRECT);
  errorRedirect.searchParams.append(
    'm',
    Buffer.from(err.message, 'utf8').toString('hex')
  );
  res.redirect(errorRedirect.toString());
});

export default router;

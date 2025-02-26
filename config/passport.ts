import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import { prisma } from '../db/client';
import { Gender } from '@prisma/client';

passport.use(
  new GoogleStrategy.Strategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET as string,
      callbackURL: '/api/v1/auth/google/redirect',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0].value;
        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;

        if (!email || !firstName || !lastName) {
          done('data not provided from google');
          return;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          const user = await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              userInfo: {
                create: {
                  gender: Gender.unkown,
                },
              },
              verified: true,
              userCompleted: false,
            },
          });
          done(null, user);

          return;
        }

        done(null, user);
      } catch (e) {
        done(e);
      }
    }
  )
);

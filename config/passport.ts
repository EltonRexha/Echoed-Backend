import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from 'passport-github2';
import { prisma } from '../db/client';
import { Gender } from '@prisma/client';

passport.use(
  new GoogleStrategy(
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
        const photo: undefined | string =
          profile.photos && profile.photos[0].value;

        if (!email || !firstName || !lastName) {
          done('data not provided from google');
          return;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        const googleUser = await prisma.googleUser.findUnique({
          where: {
            email,
          },
        });

        //Normal user found
        if (user) {
          done(null, user);
          return;
        }

        if (!googleUser) {
          const user = await prisma.googleUser.create({
            data: {
              email,
              firstName,
              lastName,
              googleUserId: profile.id,
              profileUrl: photo,
            },
          });
          done(null, user);

          return;
        }

        done(null, googleUser);
      } catch (e) {
        done(e);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_OAUTH_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET as string,
      callbackURL: '/api/v1/auth/github/redirect',
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GitHubProfile,
      done: (error: any, user?: Express.User | false) => void
    ) => {
      try {
        const firstName = profile.name?.givenName || 'githubUser';
        const lastName = profile.name?.familyName || 'githubUser';
        const photo: undefined | string =
          profile.photos && profile.photos[0].value;

        if (!firstName || !lastName) {
          done('not enough data provided from github');
          return;
        }

        const user = await prisma.user.findFirst({
          where: {
            githubUser: {
              userId: profile.id,
            },
          },
        });

        const githubUser = await prisma.githubUser.findFirst({
          where: {
            githubUserId: profile.id,
          },
        });

        //Normal user found
        if (user) {
          return done(null, user);
        }

        if (!githubUser) {
          const user = await prisma.githubUser.create({
            data: {
              firstName,
              lastName,
              githubUserId: profile.id,
              profileUrl: photo,
            },
          });
          done(null, user);

          return;
        }

        return done(null, githubUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from 'passport-github2';
import { prisma } from '../db/client';
import internalError from '../errors/errorTypes/internalError';

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

        if (!email) {
          done(
            new Error('your google profile does not provide enough information')
          );
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
          if (user.verified) {
            //Authenticated as that normal user
            done(null, user);
            return;
          }
          //Delete the user
          await prisma.user.delete({
            where: {
              id: user.id,
            },
          });
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
        done(internalError());
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
      scope: ['user:email'],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GitHubProfile,
      done: (error: any, user?: Express.User | false) => void
    ) => {
      try {
        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;
        const photo: undefined | string =
          profile.photos && profile.photos[0].value;

        const email = profile.emails && profile.emails[0].value;

        if (!email) {
          done(
            new Error('your github profile does not provide enough information')
          );
          return;
        }

        const sameEmailUser = await prisma.user.findUnique({
          where: {
            email: email,
          },
        });

        if (sameEmailUser && !sameEmailUser.verified) {
          await prisma.user.delete({
            where: {
              id: sameEmailUser.id,
            },
          });
        }

        if (sameEmailUser && sameEmailUser.verified) {
          done(new Error('Please login with your email'));
          return;
        }

        const user = await prisma.user.findFirst({
          where: {
            githubUser: {
              githubUserId: profile.id,
            },
          },
        });

        const githubUser = await prisma.githubUser.findFirst({
          where: {
            githubUserId: profile.id,
          },
        });

        //Local user found
        if (user) {
          return done(null, user);
        }

        if (!githubUser) {
          const user = await prisma.githubUser.create({
            data: {
              email,
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
        return done(internalError());
      }
    }
  )
);

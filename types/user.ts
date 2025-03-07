import { GithubUser, GoogleUser, User as LocalUser } from '@prisma/client';

export type User = LocalUser | GithubUser | GoogleUser;

//user defined typeguard

export function isLocalUser(user: User): user is LocalUser {
  return user.UserType === 'local';
}

export function isGithubUser(user: User): user is GithubUser {
  return user.UserType === 'github';
}

export function isGoogleUser(user: User): user is GoogleUser {
  return user.UserType === 'google';
}

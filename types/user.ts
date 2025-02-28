import { GithubUser, GoogleUser, User as NormalUser } from '@prisma/client';

export type User = NormalUser | GithubUser | GoogleUser;

import { User as LocalUser } from '@prisma/client';
import { Request, Response } from 'express';
import { postRecommendationService } from '../services/postRecommendationService';

export async function getForYouPosts(req: Request, res: Response) {
  const user = req.user as LocalUser;

  const { page, limit } = req.query;

  const forYouPosts = await postRecommendationService.forYouPosts({
    userId: user.id,
    page: !page ? undefined : parseInt(page as string),
    limit: !limit ? undefined : parseInt(limit as string),
  });

  res.status(200).json(forYouPosts);
}

export async function getFollowingPosts(req: Request, res: Response) {
  const user = req.user as LocalUser;

  const { page, limit } = req.query;

  const followingPosts = await postRecommendationService.followingPosts({
    userId: user.id,
    page: !page ? undefined : parseInt(page as string),
    limit: !limit ? undefined : parseInt(limit as string),
  });

  res.status(200).json(followingPosts);
}

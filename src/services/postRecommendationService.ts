import { Post } from '@prisma/client';
import { prisma } from '../db/client';
import weightedSelection from '../utils/recommendation';
import _ from 'lodash';
import { subDays } from 'date-fns';
import { cache } from './cacheService';
import { userService } from './userService';
import {
  getPostIncludeWithUserStatus,
  POST_FULL_INCLUDE,
  POST_TRENDING_ORDER_BY,
  addUserInteractionFlags,
} from '../utils/postQueryPatterns';

const FOR_YOU_WEIGHTS = {
  preferredTags: 0.4,
  following: 0.3,
  trending: 0.3,
} as const;

const FOR_YOUR_CHOICES_AMOUNT = 100;
const FOLLOWING_POST_AMOUNT = 100;

export namespace postRecommendationService {
  export async function getTrendingPosts(
    amount: number,
    recentDate: Date = subDays(new Date(), 1),
    userId: string
  ) {
    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gt: recentDate,
        },
      },
      orderBy: POST_TRENDING_ORDER_BY,
      take: amount,
      include: getPostIncludeWithUserStatus(userId),
    });

    return userId ? addUserInteractionFlags(posts) : posts;
  }

  export async function getTrendingFollowingPosts(
    amount: number,
    userId: string,
    recentDate: Date = subDays(new Date(), 1)
  ) {
    return await prisma.post.findMany({
      where: {
        createdAt: {
          gt: recentDate,
        },
        author: {
          followers: {
            some: {
              id: userId,
            },
          },
        },
      },
      orderBy: POST_TRENDING_ORDER_BY,
      take: amount,
      include: getPostIncludeWithUserStatus(userId),
    });
  }

  export async function getPostsFromPreferredTags(
    amount: number,
    userId: string
  ) {
    const mostPreferredTags = await getUsersMostPreferredTags(userId, amount);

    return await prisma.post.findMany({
      where: {
        PostTags: {
          some: {
            OR: mostPreferredTags.map((tag) => ({ id: tag.postTagsId })),
          },
        },
      },
      orderBy: POST_TRENDING_ORDER_BY,
      take: amount,
      include: getPostIncludeWithUserStatus(userId),
    });
  }

  async function getForYouPostsFromCache(
    userId: string,
    choicesAmount = FOR_YOUR_CHOICES_AMOUNT
  ) {
    const posts = await cache.getOrSetCache({
      cb: async () => {
        const forYouPosts: Post[] = [];

        //Get random set of choices based on weights
        const choicesPostAmount = weightedSelection(
          FOR_YOU_WEIGHTS,
          choicesAmount
        );

        for (const k in choicesPostAmount) {
          const choice = k as keyof typeof choicesPostAmount;

          if (choice === 'trending') {
            const choiceAmount = choicesPostAmount[choice];

            await addTrendingPosts(forYouPosts, choiceAmount, userId);
            continue;
          }

          if (choice === 'following') {
            const choiceAmount = choicesPostAmount[choice];

            const posts = await addTrendingFromFollowingPosts(
              forYouPosts,
              choiceAmount,
              userId
            );

            //For some reason could not get the amount required
            //Pick trending posts
            if (posts.length < choiceAmount) {
              const rest = choiceAmount - posts.length;
              await addTrendingPosts(forYouPosts, rest, userId);
            }

            continue;
          }

          if (choice === 'preferredTags') {
            const choiceAmount = choicesPostAmount[choice];

            const posts = await addPreferredTagsPosts(
              forYouPosts,
              choiceAmount,
              userId
            );

            //For some reason could not get the amount required
            //Pick trending posts
            if (posts.length < choiceAmount) {
              const rest = choiceAmount - posts.length;
              await addTrendingPosts(forYouPosts, rest, userId);
            }

            continue;
          }

          const _exhaustiveCheck: never = choice;
          throw new Error('Unsupported recommendation method');
        }

        return _.shuffle(forYouPosts);
      },
      cacheType: 'medium',
      keyName: 'forYouPosts',
      keyParams: {
        userId,
      },
    });

    return posts;
  }

  /**
   * Uses multiple factors to recommend posts to user and caches them
   * Then uses the pagination to go through the cached posts
   */
  export async function forYouPosts({
    userId,
    page = 1,
    limit = 10,
    calledInternally = false,
    choicesAmount = FOR_YOUR_CHOICES_AMOUNT,
  }: {
    userId: string;
    page?: number;
    limit?: number;
    calledInternally?: boolean;
    choicesAmount?: number;
  }) {
    const skip = (page - 1) * limit;

    //Get up to some amount posts
    const posts = await getForYouPostsFromCache(userId, choicesAmount);

    const slicedPosts = _.slice(posts, skip, skip + limit);

    if (slicedPosts.length === 0 && !calledInternally) {
      await cache.invalidateCache({
        keyName: 'forYouPosts',
        keyParams: {
          userId,
        },
      });

      return await forYouPosts({
        userId,
        page,
        limit,
        calledInternally: true,
        choicesAmount: choicesAmount * 2,
      });
    }

    return { posts: slicedPosts, page };
  }

  export async function followingPosts({
    userId,
    page = 1,
    limit = 10,
  }: {
    userId: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;
    const posts = _.shuffle(
      await cache.getOrSetCache({
        cb: async () => {
          const followingUsers = await userService.getFollowingUsers({
            userId,
          });
          return await prisma.post.findMany({
            where: {
              author: {
                id: {
                  in: followingUsers.map((user) => user.id),
                },
              },
            },
            orderBy: POST_TRENDING_ORDER_BY,
            take: FOLLOWING_POST_AMOUNT,
            include: getPostIncludeWithUserStatus(userId),
          });
        },
        cacheType: 'medium',
        keyName: 'followingPosts',
        keyParams: {
          userId,
        },
      })
    );

    return _.slice(posts, skip, skip + limit);
  }

  export async function addPreferredTag(
    tagId: string,
    userId: string,
    incrementAmount: number = 0.05
  ) {
    return await prisma.userPreferredTags.upsert({
      where: {
        userId_postTagsId: {
          postTagsId: tagId,
          userId: userId,
        },
      },
      create: {
        level: incrementAmount,
        user: {
          connect: {
            id: userId,
          },
        },
        tag: {
          connect: {
            id: tagId,
          },
        },
      },
      update: {
        level: {
          increment: incrementAmount,
        },
      },
    });
  }

  async function getUsersMostPreferredTags(userId: string, amount: number = 5) {
    return cache.getOrSetCache({
      cb: async () => {
        return await prisma.userPreferredTags.findMany({
          where: {
            user: {
              id: userId,
            },
          },
          orderBy: {
            level: 'desc',
          },
          take: amount,
        });
      },
      cacheType: 'short',
      keyName: 'userPreferredTags',
      keyParams: {
        amount: amount.toString(),
        userId: userId.toString(),
      },
    });
  }

  async function addTrendingPosts(
    posts: Post[],
    amount: number,
    userId: string
  ) {
    const preferredTags = await getTrendingPosts(amount, undefined, userId);

    preferredTags.forEach((post: any) => {
      posts.push(post);
    });

    return preferredTags;
  }

  async function addTrendingFromFollowingPosts(
    posts: Post[],
    amount: number,
    userId: string
  ) {
    const preferredPosts = await getTrendingFollowingPosts(amount, userId);

    preferredPosts.forEach((post) => {
      posts.push(post);
    });

    return preferredPosts;
  }

  async function addPreferredTagsPosts(
    posts: Post[],
    amount: number,
    userId: string
  ) {
    const preferredPosts = await getPostsFromPreferredTags(amount, userId);

    preferredPosts.forEach((post) => {
      posts.push(post);
    });

    return preferredPosts;
  }
}

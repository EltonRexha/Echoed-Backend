import { Post } from '@prisma/client';
import { prisma } from '../db/client';
import weightedSelection from '../utils/recommendation';
import _ from 'lodash';
import { subDays } from 'date-fns';
import { cache } from './cacheService';
import { userService } from './userService';

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
    recentDate: Date = subDays(new Date(), 1)
  ) {
    return cache.getOrSetCache({
      cb: async () => {
        return await prisma.post.findMany({
          where: {
            createdAt: {
              gt: recentDate,
            },
          },
          orderBy: [
            {
              likedBy: {
                _count: 'desc',
              },
            },
            {
              savedBy: {
                _count: 'desc',
              },
            },
            {
              Reposts: {
                _count: 'desc',
              },
            },
            {
              postComments: {
                _count: 'desc',
              },
            },
          ],
          take: amount,
          include: {
            PostTags: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        });
      },
      cacheType: 'medium',
      keyName: 'trendingPosts',
      keyParams: {
        amount: amount.toString(),
        recentDate: recentDate.toString(),
      },
    });
  }

  export async function getTrendingFollowingPosts(
    amount: number,
    userId: string,
    recentDate: Date = subDays(new Date(), 1)
  ) {
    return cache.getOrSetCache({
      cb: async () => {
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
          orderBy: [
            {
              likedBy: {
                _count: 'desc',
              },
            },
            {
              savedBy: {
                _count: 'desc',
              },
            },
            {
              Reposts: {
                _count: 'desc',
              },
            },
            {
              postComments: {
                _count: 'desc',
              },
            },
          ],
          take: amount,
          include: {
            PostTags: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        });
      },
      cacheType: 'medium',
      keyName: 'trendingFollowingPosts',
      keyParams: {
        userId,
        amount: amount.toString(),
        recentDate: recentDate.toString(),
      },
    });
  }

  export async function getPostsFromPreferredTags(
    amount: number,
    userId: string
  ) {
    return cache.getOrSetCache({
      cb: async () => {
        const mostPreferredTags = await getUsersMostPreferredTags(
          userId,
          amount
        );

        return await prisma.post.findMany({
          where: {
            PostTags: {
              some: {
                OR: mostPreferredTags.map((tag) => ({ id: tag.postTagsId })),
              },
            },
          },
          orderBy: [
            {
              likedBy: {
                _count: 'desc',
              },
            },
            {
              savedBy: {
                _count: 'desc',
              },
            },
            {
              Reposts: {
                _count: 'desc',
              },
            },
            {
              postComments: {
                _count: 'desc',
              },
            },
          ],
          take: amount,
          include: {
            PostTags: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        });
      },
      cacheType: 'medium',
      keyName: 'trendingFromPreferredTagsPosts',
      keyParams: {
        amount: amount.toString(),
        userId: userId.toString(),
      },
    });
  }

  /**
   * Uses multiple factors to recommend posts to user and caches them
   * Then uses the pagination to go through the cached posts
   *
   *
   *
   *
   */
  export async function forYouPosts({
    userId,
    page = 1,
    limit = 10,
  }: {
    userId: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;

    //Get up to some amount posts
    const posts = _.shuffle(
      await cache.getOrSetCache({
        cb: async () => {
          const forYouPosts: Post[] = [];

          //Get random set of choices based on weights
          const choicesPostAmount = weightedSelection(
            FOR_YOU_WEIGHTS,
            FOR_YOUR_CHOICES_AMOUNT
          );

          for (const k in choicesPostAmount) {
            const choice = k as keyof typeof choicesPostAmount;

            if (choice === 'trending') {
              const choiceAmount = choicesPostAmount[choice];

              await addTrendingPosts(forYouPosts, choiceAmount);
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
                await addTrendingPosts(forYouPosts, rest);
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
                await addTrendingPosts(forYouPosts, rest);
              }

              continue;
            }

            const _exhaustiveCheck: never = choice;
            throw new Error('Unsupported recommendation method');
          }

          return forYouPosts;
        },
        cacheType: 'medium',
        keyName: 'forYouPosts',
        keyParams: {
          userId,
        },
      })
    );

    return { posts: _.slice(posts, skip, skip + limit), page };
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
            orderBy: [
              {
                likedBy: {
                  _count: 'desc',
                },
              },
              {
                savedBy: {
                  _count: 'desc',
                },
              },
              {
                Reposts: {
                  _count: 'desc',
                },
              },
              {
                postComments: {
                  _count: 'desc',
                },
              },
            ],
            take: FOLLOWING_POST_AMOUNT,
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

  async function addTrendingPosts(posts: Post[], amount: number) {
    const preferredTags = await getTrendingPosts(amount);

    preferredTags.forEach((post) => {
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

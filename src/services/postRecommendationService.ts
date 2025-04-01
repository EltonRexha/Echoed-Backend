import { Post } from '@prisma/client';
import { prisma } from '../db/client';
import weightedSelection from '../utils/recommendation';
import _ from 'lodash';
import { subDays } from 'date-fns';
import { cache } from './cacheService';

const FOR_YOU_WEIGHTS = {
  preferredTags: 0.4,
  following: 0.3,
  trending: 0.3,
} as const;

const FOR_YOUR_CHOICES_AMOUNT = 100;

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
          orderBy: {
            likedBy: {
              _count: 'desc',
            },
            savedBy: {
              _count: 'desc',
            },
            Reposts: {
              _count: 'desc',
            },
          },
          take: amount,
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
          orderBy: {
            likedBy: {
              _count: 'desc',
            },
            savedBy: {
              _count: 'desc',
            },
            Reposts: {
              _count: 'desc',
            },
          },
          take: amount,
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
          orderBy: {
            likedBy: {
              _count: 'desc',
            },
            savedBy: {
              _count: 'desc',
            },
            Reposts: {
              _count: 'desc',
            },
          },
          take: amount,
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

  export async function forYouPosts(userId: string) {
    return cache.getOrSetCache({
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

        return _.shuffle(forYouPosts);
      },
      cacheType: 'medium',
      keyName: 'forYouPosts',
      keyParams: {
        userId,
      },
    });
  }

  export function followingPosts() {}

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
      cacheType: 'long',
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

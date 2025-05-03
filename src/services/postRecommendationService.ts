import { Post } from '@prisma/client';
import { prisma } from '../db/client';
import weightedSelection from '../utils/recommendation';
import _ from 'lodash';
import { subDays } from 'date-fns';
import { cache } from './cacheService';
import { userService } from './userService';
import {
  getPostIncludeWithUserStatus,
  POST_TRENDING_ORDER_BY,
  addUserInteractionFlags,
} from '../utils/postQueryPatterns';


const FOR_YOU_WEIGHTS = {
  preferredTags: 0.4,
  following: 0.3,
  trending: 0.3,
} as const;

const FOR_YOUR_CHOICES_AMOUNT = 500;
const FOLLOWING_POST_AMOUNT = 500;
const DEFAULT_POSTS_TIME_WINDOW_DAYS = 7; // One week default time window

export namespace postRecommendationService {
  /**
   * Gets trending posts with progressive date expansion if not enough posts are found.
   * It will incrementally expand the date range by multiplying the recency period until
   * the required number of posts is met or a maximum expansion is reached.
   */
  export async function getTrendingPosts({
    amount,
    timeWindowStart = subDays(new Date(), DEFAULT_POSTS_TIME_WINDOW_DAYS),
    prevPostIds = [],
    userId,
    maxRetries = 3,
    currentRetry = 0,
    originalDays = DEFAULT_POSTS_TIME_WINDOW_DAYS,
  }: {
    amount: number;
    timeWindowStart?: Date;
    prevPostIds?: string[];
    userId: string;
    maxRetries?: number;
    currentRetry?: number;
    originalDays?: number;
  }): Promise<Post[]> {
    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gt: timeWindowStart,
        },
        id: {
          notIn: prevPostIds,
        },
      },
      orderBy: POST_TRENDING_ORDER_BY,
      take: amount,
      include: {
        ...getPostIncludeWithUserStatus(userId),
        Media: {
          select: {
            path: true,
            byteSize: true,
            mimeType: true,
          },
        },
      },
    });

    if (posts.length === amount || currentRetry >= maxRetries) {
      return userId ? addUserInteractionFlags(posts) : posts;
    }

    const nextDays = originalDays * 2 * (currentRetry + 1);
    console.log(
      `Not enough trending posts found. Expanding to ${nextDays} days ago.`
    );

    const expandedPosts: Post[] = await getTrendingPosts({
      amount,
      timeWindowStart: subDays(new Date(), nextDays),
      prevPostIds,
      userId,
      maxRetries,
      currentRetry: currentRetry + 1,
      originalDays,
    });

    return expandedPosts;
  }

  /**
   * Gets trending posts from followed accounts with progressive date expansion
   * if not enough posts are found.
   */
  export async function getTrendingFollowingPosts({
    amount,
    userId,
    timeWindowStart = subDays(new Date(), DEFAULT_POSTS_TIME_WINDOW_DAYS),
    prevPostIds = [],
    maxRetries = 3,
    currentRetry = 0,
    originalDays = DEFAULT_POSTS_TIME_WINDOW_DAYS,
  }: {
    amount: number;
    userId: string;
    timeWindowStart?: Date;
    prevPostIds?: string[];
    maxRetries?: number;
    currentRetry?: number;
    originalDays?: number;
  }): Promise<Post[]> {
    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gt: timeWindowStart,
        },
        author: {
          followers: {
            some: {
              id: userId,
            },
          },
        },
        id: {
          notIn: prevPostIds,
        },
      },
      orderBy: POST_TRENDING_ORDER_BY,
      take: amount,
      include: {
        ...getPostIncludeWithUserStatus(userId),
        Media: {
          select: {
            path: true,
            byteSize: true,
            mimeType: true,
          },
        },
      },
    });

    if (posts.length === amount || currentRetry >= maxRetries) {
      return posts;
    }

    const nextDays = originalDays * 2 * (currentRetry + 1);
    console.log(
      `Not enough following posts found. Expanding to ${nextDays} days ago.`
    );

    const expandedPosts: Post[] = await getTrendingFollowingPosts({
      amount,
      userId,
      timeWindowStart: subDays(new Date(), nextDays),
      prevPostIds,
      maxRetries,
      currentRetry: currentRetry + 1,
      originalDays,
    });

    return expandedPosts;
  }

  export async function getPostsFromPreferredTags({
    amount,
    userId,
    prevPostIds = [],
    timeWindowStart = subDays(new Date(), DEFAULT_POSTS_TIME_WINDOW_DAYS),
    maxRetries = 3,
    currentRetry = 0,
    originalDays = DEFAULT_POSTS_TIME_WINDOW_DAYS,
  }: {
    amount: number;
    userId: string;
    prevPostIds?: string[];
    timeWindowStart?: Date;
    maxRetries?: number;
    currentRetry?: number;
    originalDays?: number;
  }): Promise<Post[]> {
    const mostPreferredTags = await getUsersMostPreferredTags({
      userId,
      amount,
    });

    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gt: timeWindowStart,
        },
        PostTags: {
          some: {
            OR: mostPreferredTags.map((tag) => ({ id: tag.postTagsId })),
          },
        },
        id: {
          notIn: prevPostIds,
        },
      },
      orderBy: POST_TRENDING_ORDER_BY,
      take: amount,
      include: {
        ...getPostIncludeWithUserStatus(userId),
        Media: {
          select: {
            path: true,
            byteSize: true,
            mimeType: true,
          },
        },
      },
    });

    if (posts.length === amount || currentRetry >= maxRetries) {
      return posts;
    }

    const nextDays = originalDays * 2 * (currentRetry + 1);
    console.log(
      `Not enough preferred tag posts found. Expanding to ${nextDays} days ago.`
    );

    const expandedPosts: Post[] = await getPostsFromPreferredTags({
      amount,
      userId,
      prevPostIds,
      timeWindowStart: subDays(new Date(), nextDays),
      maxRetries,
      currentRetry: currentRetry + 1,
      originalDays,
    });

    return expandedPosts;
  }

  async function getForYouPostsFromCache({
    userId,
    choicesAmount = FOR_YOUR_CHOICES_AMOUNT,
  }: {
    userId: string;
    choicesAmount?: number;
  }) {
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

            await addTrendingPosts({
              posts: forYouPosts,
              amount: choiceAmount,
              userId,
              prevPostIds: forYouPosts.map((item) => item.id),
            });
            console.log('adding trending posts');
            continue;
          }

          if (choice === 'following') {
            const choiceAmount = choicesPostAmount[choice];

            const posts = await addTrendingFromFollowingPosts({
              posts: forYouPosts,
              amount: choiceAmount,
              userId,
              prevPostIds: forYouPosts.map((item) => item.id),
            });

            //For some reason could not get the amount required
            //Pick trending posts
            if (posts.length < choiceAmount) {
              const rest = choiceAmount - posts.length;
              console.log('Not enough', rest, 'following');
              console.log('Before forYouPosts length', forYouPosts.length);
              await addTrendingPosts({
                posts: forYouPosts,
                amount: rest,
                userId,
                prevPostIds: forYouPosts.map((item) => item.id),
              });
              console.log('After forYouPosts length', forYouPosts.length);
            }

            continue;
          }

          if (choice === 'preferredTags') {
            const choiceAmount = choicesPostAmount[choice];

            const posts = await addPreferredTagsPosts({
              posts: forYouPosts,
              amount: choiceAmount,
              userId,
              prevPostIds: forYouPosts.map((item) => item.id),
            });

            //For some reason could not get the amount required
            //Pick trending posts
            if (posts.length < choiceAmount) {
              const rest = choiceAmount - posts.length;
              console.log('Not enough', rest, 'preferred tags');
              console.log('Before forYouPosts length', forYouPosts.length);
              await addTrendingPosts({
                posts: forYouPosts,
                amount: rest,
                userId,
                prevPostIds: forYouPosts.map((item) => item.id),
              });
              console.log('After forYouPosts length', forYouPosts.length);
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
    });

    return _.shuffle(posts);
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
    const posts = await getForYouPostsFromCache({ userId, choicesAmount });

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
          return _.shuffle(
            await prisma.post.findMany({
              where: {
                author: {
                  id: {
                    in: followingUsers.map((user) => user.id),
                  },
                },
              },
              orderBy: POST_TRENDING_ORDER_BY,
              take: FOLLOWING_POST_AMOUNT,
              include: {
                ...getPostIncludeWithUserStatus(userId),
                Media: {
                  select: {
                    path: true,
                    byteSize: true,
                    mimeType: true,
                  },
                },
              },
            })
          );
        },
        cacheType: 'medium',
        keyName: 'followingPosts',
        keyParams: {
          userId,
        },
      })
    );

    return { posts: _.slice(posts, skip, skip + limit) };
  }

  export async function addPreferredTag({
    tagId,
    userId,
    incrementAmount = 0.05,
  }: {
    tagId: string;
    userId: string;
    incrementAmount?: number;
  }) {
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

  async function getUsersMostPreferredTags({
    userId,
    amount = 5,
  }: {
    userId: string;
    amount?: number;
  }) {
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

  async function addTrendingPosts({
    posts,
    amount,
    userId,
    prevPostIds = [],
  }: {
    posts: Post[];
    amount: number;
    userId: string;
    prevPostIds?: string[];
  }) {
    const preferredTags = await getTrendingPosts({
      amount,
      userId,
      prevPostIds,
    });

    preferredTags.forEach((post: Post) => {
      posts.push(post);
    });

    return preferredTags;
  }

  async function addTrendingFromFollowingPosts({
    posts,
    amount,
    userId,
    prevPostIds = [],
  }: {
    posts: Post[];
    amount: number;
    userId: string;
    prevPostIds?: string[];
  }) {
    const preferredPosts = await getTrendingFollowingPosts({
      amount,
      userId,
      prevPostIds,
    });

    preferredPosts.forEach((post: Post) => {
      posts.push(post);
    });

    return preferredPosts;
  }

  async function addPreferredTagsPosts({
    posts,
    amount,
    userId,
    prevPostIds,
  }: {
    posts: Post[];
    amount: number;
    userId: string;
    prevPostIds?: string[];
  }) {
    const preferredPosts = await getPostsFromPreferredTags({
      amount,
      userId,
      prevPostIds,
    });

    preferredPosts.forEach((post: Post) => {
      posts.push(post);
    });

    return preferredPosts;
  }
}

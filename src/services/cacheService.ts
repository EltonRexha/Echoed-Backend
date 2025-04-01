/**
 * We are using redis as caching our queries
 * every query is saved as key=value pair
 * where the key looks like resource?key=value&key2=value2
 * each resource has a specific allowed keys depending the
 * queries on its service
 *
 * How does invalidation work?
 *
 * Well you are going to pass a keyParam object
 * then it will check all the keys in the redis db
 * and check the key=value pair to match your keyParams
 * at least one has to match and it will remove from cache
 *
 */

import redisClient from '../config/redis';
import { prisma } from '../db/client';

const cacheTime = {
  //10 minutes
  short: 10 * 60,
  //30 minutes
  medium: 30 * 60,
  //6 hours
  long: 6 * 60 * 60,
  //12 hours
  veryLong: 12 * 60 * 60,
  //1 week
  weekly: 7 * 24 * 60 * 60,
  //1 month
  monthly: 31 * 24 * 60 * 60,
} satisfies { [key: string]: number };

export interface KeyParams {
  post: {
    postId?: string;
    authorId?: string;
    authorUsername?: string;
    authorEmail?: string;
    likedByUserId?: string;
    savedByUserId?: string;
    parentPostId?: string;
    page?: number;
    limit?: number;
    tags?: string[];
  };
  comment: {
    commentId?: string;
    authorId?: string;
    authorUsername?: string;
    authorEmail?: string;
    likedByUserId?: string;
    savedByUserId?: string;
    parentCommentId?: string;
    postId?: string;
    page?: number;
    limit?: number;
  };
  user: {
    id?: string;
    email?: string;
    username?: string;
    page?: number;
    limit?: number;
  };
  trendingPosts: {
    amount?: string;
    recentDate?: string;
  };
  trendingFollowingPosts: {
    amount?: string;
    recentDate?: string;
    userId?: string;
  };
  trendingFromPreferredTagsPosts: {
    amount?: string;
    userId?: string;
  };
  userPreferredTags: {
    userId?: string;
    amount?: string;
  };
  forYouPosts: {
    userId?: string;
  };
}

type KeyName = keyof KeyParams;

function generateKeyFromKeyParams<T extends KeyName>({
  keyName,
  keyParams,
}: {
  keyName: T;
  keyParams?: KeyParams[T];
}) {
  let key = keyName as string;

  for (const keyParam in keyParams) {
    key += `?${keyParam}=${keyParams[keyParam]}`;
  }

  return key;
}

async function deleteMatchingKeys<T extends KeyName>({
  keyName,
  keyParams,
}: {
  keyName: T;
  keyParams?: KeyParams[T];
}) {
  try {
    const pattern = `${keyName}*`;
    let cursor = 0;
    let keysToDelete: string[] = [];

    do {
      const { cursor: newCursor, keys: foundKeys } = await redisClient.scan(
        cursor,
        {
          MATCH: pattern,
          COUNT: 100,
        }
      );

      cursor = newCursor;

      foundKeys.forEach((key: string) => {
        if (
          keyParams &&
          Object.entries(keyParams).some(([param, value]) =>
            key.includes(`${param}=${value}`)
          )
        ) {
          keysToDelete.push(key);
        }
      });
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
    throw error;
  }
}

export namespace cache {
  export async function getCache<T extends KeyName>({
    keyName,
    keyParams,
  }: {
    keyName: T;
    keyParams?: KeyParams[T];
  }) {
    let key = generateKeyFromKeyParams({ keyName, keyParams });

    return await redisClient.get(key);
  }

  export async function setCache<T extends KeyName>({
    keyName,
    keyParams,
    value,
    cacheType,
  }: {
    keyName: T;
    keyParams?: KeyParams[T];
    value: string;
    cacheType: keyof typeof cacheTime;
  }) {
    let key = generateKeyFromKeyParams({ keyName, keyParams });

    return await redisClient.setEx(key, cacheTime[cacheType], value);
  }

  export async function getOrSetCache<T extends KeyName, G>({
    keyName,
    keyParams,
    cb,
    cacheType,
  }: {
    keyName: T;
    keyParams?: KeyParams[T];
    cb: () => Promise<G>;
    cacheType: keyof typeof cacheTime;
  }): Promise<G> {
    let key = generateKeyFromKeyParams({ keyName, keyParams });
    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as G;
      }

      const data = await cb();

      await redisClient.setEx(key, cacheTime[cacheType], JSON.stringify(data));

      return data;
    } catch (error) {
      throw error;
    }
  }

  export async function invalidateCache<T extends KeyName>({
    keyName,
    keyParams,
  }: {
    keyName: T;
    keyParams: KeyParams[T];
  }) {
    try {
      await deleteMatchingKeys({ keyName, keyParams });
    } catch (error) {
      throw error;
    }
  }
}

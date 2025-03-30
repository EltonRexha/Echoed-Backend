import redisClient from '../config/redis';

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

function generateKeyFromKeyParams({
  keyName,
  keyParams,
}: {
  keyName: string;
  keyParams?: Record<string, any>;
}) {
  let key = keyName;

  for (const keyParam in keyParams) {
    key += `?${keyParam}=${keyParams[keyParam]}`;
  }

  return key;
}

async function deleteMatchingKeys({
  keyName,
  keyParams,
}: {
  keyName: string;
  keyParams?: Record<string, any>;
}) {
  try {
    const pattern = `${keyName}*`;
    let cursor = 0;
    let keysToDelete: string[] = [];

    console.log('in here');

    do {
      const { cursor: newCursor, keys: foundKeys } = await redisClient.scan(
        cursor,
        {
          MATCH: pattern,
          COUNT: 100,
        }
      );

      console.log(foundKeys)
      cursor = newCursor;

      foundKeys.forEach((key: string) => {
        if (
          keyParams &&
          Object.entries(keyParams).every(([param, value]) =>
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
  export async function getCache({
    keyName,
    keyParams,
  }: {
    keyName: string;
    keyParams?: Record<string, any>;
  }) {
    let key = generateKeyFromKeyParams({ keyName, keyParams });

    return await redisClient.get(key);
  }

  export async function setCache({
    keyName,
    keyParams,
    value,
    cacheType,
  }: {
    keyName: string;
    keyParams?: Record<string, any>;
    value: string;
    cacheType: keyof typeof cacheTime;
  }) {
    let key = generateKeyFromKeyParams({ keyName, keyParams });

    return await redisClient.setEx(key, cacheTime[cacheType], value);
  }

  export async function getOrSetCache<T>({
    keyName,
    keyParams,
    cb,
    cacheType,
  }: {
    keyName: string;
    keyParams?: Record<string, any>;
    cb: () => Promise<T>;
    cacheType: keyof typeof cacheTime;
  }): Promise<T> {
    let key = generateKeyFromKeyParams({ keyName, keyParams });
    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }

      const data = await cb();

      await redisClient.setEx(key, cacheTime[cacheType], JSON.stringify(data));

      return data;
    } catch (error) {
      throw error;
    }
  }

  export async function invalidateCache({
    keyName,
    keyParams,
  }: {
    keyName: string;
    keyParams?: Record<string, any>;
  }) {
    try {
      await deleteMatchingKeys({ keyName, keyParams });
    } catch (error) {
      throw error;
    }
  }
}

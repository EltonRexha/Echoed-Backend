/**
 * Standardized include patterns for Prisma queries related to posts
 * Use these patterns to maintain consistency across all post queries
 */

import { Prisma } from '@prisma/client';

/**
 * Standard post include pattern with all common relationships
 * Use this for queries that need complete post data with counts and author info
 */
export const POST_FULL_INCLUDE = {
  PostTags: {
    select: {
      name: true,
      id: true,
    },
  },
  author: {
    select: {
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      ProfileImage: true,
    },
  },
  Media: true,
  MainPost: true,
  _count: {
    select: {
      Reposts: true,
      postComments: true,
      savedBy: true,
      likedBy: true,
    },
  },
};

/**
 * Simplified post include pattern with minimal required fields
 * Use this for queries that need basic post data
 */
export const POST_BASIC_INCLUDE = {
  PostTags: {
    select: {
      name: true,
      id: true,
    },
  },
  author: {
    select: {
      username: true,
      firstName: true,
      lastName: true,
      ProfileImage: true,
    },
  },
  Media: true,
  _count: {
    select: {
      Reposts: true,
      postComments: true,
      savedBy: true,
      likedBy: true,
    },
  },
};

/**
 * Standard post orderBy pattern for trending content
 * Use this for queries that need to sort posts by popularity/engagement
 */
export const POST_TRENDING_ORDER_BY = [
  {
    likedBy: {
      _count: Prisma.SortOrder.desc,
    },
  },
  {
    savedBy: {
      _count: Prisma.SortOrder.desc,
    },
  },
  {
    Reposts: {
      _count: Prisma.SortOrder.desc,
    },
  },
  {
    postComments: {
      _count: Prisma.SortOrder.desc,
    },
  },
];

/**
 * Get include pattern with user interaction status check
 *
 * @param userId User ID to check interactions against
 * @returns Include pattern with filtered likedBy and savedBy arrays
 */
export function getPostIncludeWithUserStatus(userId: string) {
  return {
    ...POST_FULL_INCLUDE,
    likedBy: {
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    },
    savedBy: {
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    },
  };
}

/**
 * Add user interaction boolean flags to post objects
 *
 * @param posts Posts with likedBy and savedBy arrays filtered by user ID
 * @returns Posts with isLiked and isSaved boolean flags
 */
export function addUserInteractionFlags(posts: any[]) {
  return posts.map((post) => ({
    ...post,
    isLiked: post.likedBy && post.likedBy.length > 0,
    isSaved: post.savedBy && post.savedBy.length > 0,
    // Remove arrays to clean up the response if desired
    likedBy: undefined,
    savedBy: undefined
  }));
}

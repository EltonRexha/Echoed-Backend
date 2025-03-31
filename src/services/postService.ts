import { prisma } from '../db/client';
import MediaInput from '../types/mediaInput';
import _ from 'lodash';
import { cache } from './cacheService';

export namespace postService {
  export async function getPosts({
    postId,
    authorId,
    authorUsername,
    authorEmail,
    likedByUserId,
    savedByUserId,
    parentPostId,
    tags,
    page = 1,
    limit = 10,
  }: {
    postId?: string;
    authorId?: string;
    authorUsername?: string;
    authorEmail?: string;
    likedByUserId?: string;
    savedByUserId?: string;
    parentPostId?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }) {
    return cache.getOrSetCache({
      cb: async () => {
        const skip = (page - 1) * limit;
        const posts = await prisma.post.findMany({
          where: {
            ...(tags && {
              postTags: {
                some: {
                  OR: tags.map((value) => ({ name: value })),
                },
              },
            }),
            ...(postId && { id: postId }),
            ...((authorId || authorEmail || authorUsername) && {
              author: {
                id: authorId,
                email: authorEmail,
                username: authorUsername,
              },
            }),
            ...(likedByUserId && {
              likedBy: {
                some: {
                  id: likedByUserId,
                },
              },
            }),
            ...(savedByUserId && {
              savedBy: {
                some: {
                  id: savedByUserId,
                },
              },
            }),

            ...(parentPostId && {
              MainPost: {
                id: parentPostId,
              },
            }),
          },
          include: {
            MainPost: true,
            Media: true,
            postTags: {
              select: {
                name: true,
              },
            },
          },
          skip,
          take: limit,
        });

        const pageCount = posts.length / limit;

        return { posts, pageCount };
      },
      cacheType: 'short',
      keyName: 'post',
      keyParams: {
        authorEmail,
        authorId,
        authorUsername,
        likedByUserId,
        parentPostId,
        postId,
        savedByUserId,
        tags,
        page,
        limit,
      },
    });
  }

  export async function getPost({ postId }: { postId: string }) {
    return cache.getOrSetCache({
      cb: async () => {
        return await prisma.post.findUnique({
          where: {
            id: postId,
          },
          include: {
            Media: true,
          },
        });
      },
      cacheType: 'short',
      keyName: 'post',
      keyParams: { postId },
    });
  }

  export async function addMediaToPost({
    id,
    media,
  }: {
    id: string;
    media: MediaInput;
  }) {
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        Media: {
          create: {
            byteSize: media.size,
            mimeType: media.mimetype,
            path: media.cloudinaryPath,
          },
        },
      },
      include: {
        author: true,
        MainPost: true,
      },
    });

    cache.invalidateCache({
      keyName: 'post',
      keyParams: {
        authorEmail: updatedPost.author.email,
        authorId: updatedPost.author.id,
        authorUsername: updatedPost.author.email,
        parentPostId: updatedPost.MainPost?.id,
        postId: updatedPost.id,
      },
    });

    return updatedPost;
  }

  export async function createPost({
    tags,
    content,
    userId,
    mainPostId,
  }: {
    tags: String[];
    content: string;
    userId: string;
    mainPostId?: string;
  }) {
    const user = (await prisma.user.findUnique({
      where: {
        id: userId,
      },
    }))!;

    cache.invalidateCache({
      keyName: 'post',
      keyParams: {
        authorId: user.id,
        authorEmail: user.email,
        authorUsername: user.username,
      },
    });

    return await prisma.$transaction(async () => {
      const postTags = await Promise.all(
        tags.map(async (tag) => {
          const lowerCaseTag = tag.toLowerCase();
          const currentTag = await prisma.postTags.upsert({
            update: {},
            where: {
              name: lowerCaseTag,
            },
            create: {
              name: lowerCaseTag,
            },
          });

          return { id: currentTag.id };
        })
      );

      return await prisma.post.create({
        data: {
          content,
          author: {
            connect: {
              id: userId,
            },
          },
          postTags: {
            connect: postTags,
          },
          ...(mainPostId && {
            MainPost: {
              connect: {
                id: mainPostId,
              },
            },
          }),
        },
      });
    });
  }

  export async function likePost({
    userId,
    postId,
  }: {
    userId: string;
    postId: string;
  }) {
    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        likedBy: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        author: true,
      },
    });

    cache.invalidateCache({
      keyName: 'post',
      keyParams: {
        authorEmail: updatedPost.author.email,
        authorId: updatedPost.author.id,
        authorUsername: updatedPost.author.username,
        postId: updatedPost.id,
      },
    });

    return updatedPost;
  }

  export async function savePost({
    userId,
    postId,
  }: {
    userId: string;
    postId: string;
  }) {
    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        savedBy: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        author: true,
      },
    });

    cache.invalidateCache({
      keyName: 'post',
      keyParams: {
        authorEmail: updatedPost.author.email,
        authorId: updatedPost.author.id,
        authorUsername: updatedPost.author.username,
        postId: updatedPost.id,
      },
    });

    return updatedPost;
  }

  export async function deletePost({ postId }: { postId: string }) {
    const deletedPost = await prisma.post.delete({
      where: {
        id: postId,
      },
      include: {
        author: true,
        postTags: true,
        MainPost: true,
      },
    });

    cache.invalidateCache({
      keyName: 'post',
      keyParams: {
        authorEmail: deletedPost.author.email,
        authorId: deletedPost.author.id,
        authorUsername: deletedPost.author.username,
        postId: deletedPost.id,
        tags: deletedPost.postTags.map((value) => value.name),
        parentPostId: deletedPost.MainPost?.id,
      },
    });

    return deletedPost;
  }
}

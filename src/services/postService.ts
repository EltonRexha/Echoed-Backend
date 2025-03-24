import { Post } from '@prisma/client';
import { prisma } from '../db/client';

interface MediaInput {
  size: number;
  mimetype: string;
  cloudinaryPath: string;
}

export namespace postService {
  export async function getPosts({
    postId,
    authorId,
    authorUsername,
    authorEmail,
    likedByUserId,
    savedByUserId,
    page = 1,
    limit = 10,
  }: {
    postId?: string;
    authorId?: string;
    authorUsername?: string;
    authorEmail?: string;
    likedByUserId?: string;
    savedByUserId?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;
    const posts = await prisma.post.findMany({
      where: {
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

    return posts;
  }

  export async function getPost({ id }: { id: string }) {
    return await prisma.post.findUnique({
      where: {
        id,
      },
      include: {
        Media: true,
      },
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
    return await prisma.post.update({
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
    });
  }

  export async function savePost({
    userId,
    postId,
  }: {
    userId: string;
    postId: string;
  }) {
    return await prisma.post.update({
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
    });
  }
}

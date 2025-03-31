import { Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import MediaInput from '../types/mediaInput';
import { cache, KeyParams } from './cacheService';
import _ from 'lodash';

export namespace commentService {
  export async function getComments({
    commentId,
    authorId,
    authorUsername,
    authorEmail,
    likedByUserId,
    savedByUserId,
    parentCommentId,
    postId,
    page = 1,
    limit = 10,
  }: {
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
  }) {
    return cache.getOrSetCache({
      cb: async () => {
        const skip = (page - 1) * limit;
        const comments = await prisma.postComment.findMany({
          where: {
            ...(commentId && { id: commentId }),
            ...((authorId || authorEmail || authorUsername) && {
              author: {
                id: authorId,
                email: authorEmail,
                username: authorUsername,
              },
            }),
            ...(postId && {
              post: {
                id: postId,
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

            ...(parentCommentId && {
              parentComment: {
                id: parentCommentId,
              },
            }),
          },
          include: {
            Media: true,
          },
          skip,
          take: limit,
        });

        const pageCount = comments.length / limit;

        return { comments, pageCount };
      },
      cacheType: 'short',
      keyName: 'comment',
      keyParams: {
        authorEmail,
        authorId,
        authorUsername,
        commentId,
        likedByUserId,
        parentCommentId,
        postId,
        savedByUserId,
        page,
        limit,
      },
    });
  }

  export async function createComment({
    content,
    postId,
    userId,
    parentCommentId,
  }: {
    content: string;
    postId: string;
    userId: string;
    parentCommentId?: string;
  }) {
    let comment;
    if (!parentCommentId) {
      comment = await prisma.postComment.create({
        data: {
          content,
          post: {
            connect: {
              id: postId,
            },
          },
          author: {
            connect: {
              id: userId,
            },
          },
        },
        include: {
          author: true,
          parentComment: true,
        },
      });
    } else {
      comment = await prisma.postComment.create({
        data: {
          content,
          post: {
            connect: {
              id: postId,
            },
          },
          parentComment: {
            connect: {
              id: parentCommentId,
            },
          },
          author: {
            connect: {
              id: userId,
            },
          },
        },
        include: {
          author: true,
          parentComment: true,
        },
      });
    }

    cache.invalidateCache({
      keyName: 'comment',
      keyParams: {
        authorEmail: comment.author.email,
        authorId: comment.author.id,
        authorUsername: comment.author.username,
        commentId: comment.id,
        parentCommentId: comment.parentComment?.id,
        postId: comment.postId,
      },
    });

    return comment;
  }

  export async function getComment({ commentId }: { commentId: string }) {
    return cache.getOrSetCache({
      cb: async () => {
        return await prisma.postComment.findUnique({
          where: {
            id: commentId,
          },
          include: {
            Media: true,
          },
        });
      },
      cacheType: 'short',
      keyName: 'comment',
      keyParams: {
        commentId,
      },
    });
  }

  export async function likeComment({
    commentId,
    userId,
  }: {
    commentId: string;
    userId: string;
  }) {
    const updatedComment = await prisma.postComment.update({
      where: {
        id: commentId,
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
        parentComment: true,
      },
    });

    cache.invalidateCache({
      keyName: 'comment',
      keyParams: {
        authorEmail: updatedComment.author.email,
        authorId: updatedComment.author.id,
        authorUsername: updatedComment.author.username,
        commentId: updatedComment.id,
        parentCommentId: updatedComment.parentComment?.id,
        postId: updatedComment.postId,
      },
    });

    return updatedComment;
  }

  export async function saveComment({
    commentId,
    userId,
  }: {
    commentId: string;
    userId: string;
  }) {
    const updatedComment = await prisma.postComment.update({
      where: {
        id: commentId,
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
        parentComment: true,
      },
    });

    cache.invalidateCache({
      keyName: 'comment',
      keyParams: {
        authorEmail: updatedComment.author.email,
        authorId: updatedComment.author.id,
        authorUsername: updatedComment.author.username,
        commentId: updatedComment.id,
        parentCommentId: updatedComment.parentComment?.id,
        postId: updatedComment.postId,
      },
    });

    return updatedComment;
  }

  export async function addMediaToComment({
    id,
    media,
  }: {
    id: string;
    media: MediaInput;
  }) {
    const updatedComment = await prisma.postComment.update({
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
        parentComment: true,
      },
    });

    cache.invalidateCache({
      keyName: 'comment',
      keyParams: {
        authorEmail: updatedComment.author.email,
        authorId: updatedComment.author.id,
        authorUsername: updatedComment.author.username,
        commentId: updatedComment.id,
        parentCommentId: updatedComment.parentComment?.id,
        postId: updatedComment.postId,
      },
    });

    return updatedComment;
  }

  export async function deleteComment({ commentId }: { commentId: string }) {
    const deletedComment = await prisma.postComment.delete({
      where: {
        id: commentId,
      },
      include: {
        author: true,
        parentComment: true,
      },
    });

    cache.invalidateCache({
      keyName: 'comment',
      keyParams: {
        authorEmail: deletedComment.author.email,
        authorId: deletedComment.author.id,
        authorUsername: deletedComment.author.username,
        commentId: deletedComment.id,
        parentCommentId: deletedComment.parentComment?.id,
        postId: deletedComment.postId,
      },
    });

    return deletedComment;
  }
}

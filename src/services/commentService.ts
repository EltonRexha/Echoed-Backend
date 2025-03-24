import { prisma } from '../db/client';

export namespace commentService {
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
      });
    }

    return comment;
  }

  export async function getComment({
    commentId,
    postId,
  }: {
    commentId: string;
    postId?: string;
  }) {
    return await prisma.postComment.findUnique({
      where: {
        id: commentId,
        ...(postId && {
          post: {
            id: postId,
          },
        }),
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
    return await prisma.postComment.update({
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
    });
  }

  export async function saveComment({
    commentId,
    userId,
  }: {
    commentId: string;
    userId: string;
  }) {
    return await prisma.postComment.update({
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
    });
  }
}

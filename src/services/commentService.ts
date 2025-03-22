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
}

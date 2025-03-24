import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import badRequestError from '../errors/errorTypes/badRequestError';
import notFoundError from '../errors/errorTypes/notFoundError';
import hasPermission from '../utils/abacPermissions';
import { User as LocalUser } from '@prisma/client';
import forbiddenError from '../errors/errorTypes/forbiddenError';
import { postService } from '../services/postService';
import commentSchema from '../validations/commentSchema';
import { commentService } from '../services/commentService';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const commentPost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as LocalUser;

    const { postId } = req.params;

    const post = await postService.getPost({ id: postId });

    if (!post) {
      next(notFoundError('Post not found'));
      return;
    }

    const canCommentOnPost = await hasPermission(
      user,
      post,
      'comment',
      'Posts'
    );

    if (!canCommentOnPost) {
      next(
        forbiddenError("You don't have permissions to comment on this post")
      );
      return;
    }

    const { content, parentCommentId } = commentSchema.parse(req.body);

    let comment;

    if (parentCommentId) {
      const parentComment = await commentService.getComment({
        commentId: parentCommentId,
        postId: postId,
      });

      if (!parentComment) {
        next(notFoundError('Parent comment not found'));
        return;
      }

      const canCommentOnComment = await hasPermission(
        user,
        parentComment,
        'comment',
        'Comment'
      );

      if (!canCommentOnComment) {
        next(forbiddenError('You cannot comment on this parent comment'));
        return;
      }
    }

    try {
      comment = await commentService.createComment({
        content,
        postId,
        userId: user.id,
        parentCommentId,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          next(badRequestError('The referenced comment was not found.'));
          return;
        }
      }

      throw error;
    }

    res.status(200).json({
      message: 'successfully commented on post',
      details: {
        commentId: comment.id,
      },
    });
  }
);

export const likeComment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as LocalUser;
    const { commentId } = req.params;

    const comment = await commentService.getComment({ commentId });

    if (!comment) {
      next(notFoundError('Comment not found'));
      return;
    }

    const canLikeComment = await hasPermission(
      user,
      comment,
      'like',
      'Comment'
    );
    if (!canLikeComment) {
      next(forbiddenError('You do not have permission to like this comment'));
      return;
    }

    await commentService.likeComment({ commentId, userId: user.id });

    res.status(200).json({
      message: 'successfully liked comment',
      details: {
        commentId,
      },
    });
  }
);

export const saveComment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as LocalUser;
    const { commentId } = req.params;

    const comment = await commentService.getComment({ commentId });

    if (!comment) {
      next(notFoundError('Comment not found'));
      return;
    }

    const canSaveComment = await hasPermission(
      user,
      comment,
      'save',
      'Comment'
    );
    if (!canSaveComment) {
      next(forbiddenError('You do not have permission to save this comment'));
      return;
    }

    await commentService.saveComment({ commentId, userId: user.id });

    res.status(200).json({
      message: 'successfully liked comment',
      details: {
        commentId,
      },
    });
  }
);


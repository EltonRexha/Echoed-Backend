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
import getCommentsSchema from '../validations/getCommentsSchema';
import { imageUpload, videoUpload } from '../config/multer';
import { uploadFiles } from '../utils/uploadFiles';

const MAX_MEDIA_UPLOAD = 1;

export const postComment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as LocalUser;

    const { postId } = req.params;

    const post = await postService.getPost({ id: postId });

    if (!post) {
      next(notFoundError('Post not found'));
      return;
    }

    const [permissionToCommentOnPost, permissionToCreateComment] =
      await Promise.all([
        hasPermission(user, post, 'comment', 'Posts'),
        hasPermission(user, null, 'create', 'Comment'),
      ]);

    if (!permissionToCommentOnPost || !permissionToCreateComment) {
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

      const permissionToCommentOnComment = await hasPermission(
        user,
        parentComment,
        'comment',
        'Comment'
      );

      if (!permissionToCommentOnComment) {
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

    const permissionToLikeComment = await hasPermission(
      user,
      comment,
      'like',
      'Comment'
    );
    if (!permissionToLikeComment) {
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

    const permissionToSaveComment = await hasPermission(
      user,
      comment,
      'save',
      'Comment'
    );
    if (!permissionToSaveComment) {
      next(forbiddenError('You do not have permission to save this comment'));
      return;
    }

    await commentService.saveComment({ commentId, userId: user.id });

    res.status(200).json({
      message: 'successfully saved comment',
      details: {
        commentId,
      },
    });
  }
);

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query;
  const {
    authorEmail,
    authorId,
    authorUsername,
    id,
    parentCommentId,
    likedByUserId,
    savedByUserId,
    limit,
    page,
  } = getCommentsSchema.parse(query);

  const foundComments = await commentService.getComments({
    authorEmail,
    authorId,
    authorUsername,
    parentCommentId,
    commentId: id,
    likedByUserId,
    savedByUserId,
    limit: limit ? parseInt(limit) : 10,
    page: page ? parseInt(page) : 1,
  });

  res.status(200).json({
    comments: foundComments.comments,
    pageCount: foundComments.pageCount,
    page,
  });
});

export const deleteComment = asyncHandler(async function (
  req: Request,
  res: Response
) {
  const { commentId } = req.params;
  const user = req.user as LocalUser;

  if (!commentId) {
    res.status(400).json({
      message: 'Comment is required',
    });
    return;
  }

  const comment = await commentService.getComment({ commentId });

  if (!comment) {
    res.status(404).json({
      message: 'Comment not found',
    });
    return;
  }

  const permissionToDelete = hasPermission(user, comment, 'delete', 'Comment');

  if (!permissionToDelete) {
    res.status(403).json({
      message: "You don't have permissions to delete resource",
    });
    return;
  }

  await commentService.deleteComment({ commentId });

  res.status(200).json({
    message: 'Successfully deleted comment',
  });
});

export const uploadCommentImage = [
  imageUpload.array('images', MAX_MEDIA_UPLOAD),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as LocalUser;
    if (!req.files && !Array.isArray(req.files)) {
      next(badRequestError('No files provided'));
      return;
    }

    const { commentId } = req.params;

    if (!commentId) {
      next(badRequestError('Comment is required'));
      return;
    }

    const comment = await commentService.getComment({ commentId });

    if (!comment) {
      next(notFoundError('Comment not found'));
      return;
    }

    const permissionToUpdatePost = await hasPermission(
      req.user as LocalUser,
      comment,
      'update',
      'Comment'
    );
    if (!permissionToUpdatePost) {
      next(forbiddenError("You don't have permissions to update resource"));
      return;
    }

    if (
      comment?.Media &&
      comment.Media.length + (req.files.length as number) > MAX_MEDIA_UPLOAD
    ) {
      next(
        badRequestError(
          'Maximum amount of resources uploaded to post exceeded',
          'MAX_MEDIA'
        )
      );
      return;
    }

    const files = req.files as Express.Multer.File[];

    await uploadFiles.comment({ files, commentId: commentId, userId: user.id });

    res.status(200).json({
      message: 'successfully uploaded image',
    });
  }),
];

export const uploadCommentVideos = [
  videoUpload.array('videos', MAX_MEDIA_UPLOAD),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as LocalUser;
    if (!req.files && !Array.isArray(req.files)) {
      next(badRequestError('No files provided'));
      return;
    }

    const { commentId } = req.params;

    if (!commentId) {
      next(badRequestError('Comment is required'));
      return;
    }

    const comment = await commentService.getComment({ commentId });

    if (!comment) {
      next(notFoundError('Comment not found'));
      return;
    }

    const permissionToUpdatePost = await hasPermission(
      req.user as LocalUser,
      comment,
      'update',
      'Comment'
    );
    if (!permissionToUpdatePost) {
      next(forbiddenError("You don't have permissions to update resource"));
      return;
    }

    if (
      comment?.Media &&
      comment.Media.length + (req.files.length as number) > MAX_MEDIA_UPLOAD
    ) {
      next(
        badRequestError(
          'Maximum amount of resources uploaded to post exceeded',
          'MAX_MEDIA'
        )
      );
      return;
    }

    const files = req.files as Express.Multer.File[];

    await uploadFiles.comment({ files, commentId: commentId, userId: user.id });

    res.status(200).json({
      message: 'successfully uploaded video',
    });
  }),
];

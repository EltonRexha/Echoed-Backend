import { NextFunction, Request, Response } from 'express';
import createPostSchema from '../validations/createPostSchema';
import { User } from '../types/user';
import asyncHandler from 'express-async-handler';
import internalError from '../errors/errorTypes/internalError';
import badRequestError from '../errors/errorTypes/badRequestError';
import notFoundError from '../errors/errorTypes/notFoundError';
import { imageUpload, videoUpload } from '../config/multer';
import hasPermission from '../utils/abacPermissions';
import { User as LocalUser } from '@prisma/client';
import forbiddenError from '../errors/errorTypes/forbiddenError';
import getPostSchema from '../validations/getPostSchema';
import { postService } from '../services/postService';
import uploadFiles from '../utils/uploadFiles';

const MAX_MEDIA_UPLOAD = 3;

export const createPost = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as LocalUser;
  const { content, tags, mainPostId } = createPostSchema.parse(req.body);

  const permissionToCreatePost = await hasPermission(
    user,
    null,
    'create',
    'Posts'
  );

  if (!permissionToCreatePost) {
    next(forbiddenError('you do not have permission to create post'));
    return;
  }

  if (mainPostId) {
    const mainPost = await postService.getPost({ id: mainPostId });

    if (!mainPost) {
      next(notFoundError('Main post not found'));
      return;
    }

    const permissionToRepost = await hasPermission(
      user,
      mainPost,
      'repost',
      'Posts'
    );

    if (!permissionToRepost) {
      next(
        forbiddenError('you do not have permissions to repost on this post')
      );
      return;
    }
  }

  try {
    const post = await postService.createPost({
      tags,
      content,
      userId: user.id,
      mainPostId,
    });

    res.status(200).json({
      message: 'Successfully created post',
      details: {
        postId: post.id,
      },
    });
  } catch (e) {
    next(internalError('Could not create post'));
  }
});

export const getPost = asyncHandler(async function (
  req: Request,
  res: Response
) {
  const query = req.query;
  const data = getPostSchema.parse(query);
  const page = data.page ? parseInt(data.page) : 1;
  const limit = data.limit ? parseInt(data.limit) : 10;
  const foundPost = await postService.getPosts({
    postId: data.id,
    authorId: data.authorId,
    authorEmail: data.authorEmail,
    authorUsername: data.authorUsername,
    likedByUserId: data.likedByUserId,
    savedByUserId: data.savedByUserId,
    limit: limit,
    page: page,
  });

  res.status(200).json({
    posts: foundPost.posts,
    pageCount: foundPost.pageCount,
    page,
  });
});

export const uploadPostImage = [
  imageUpload.array('images', MAX_MEDIA_UPLOAD),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as LocalUser;
    if (!req.files && !Array.isArray(req.files)) {
      next(badRequestError('No files provided'));
      return;
    }

    const { postId } = req.params;

    if (!postId) {
      next(badRequestError('Post is required'));
      return;
    }

    const post = await postService.getPost({ id: postId });

    if (!post) {
      next(notFoundError('Post not found'));
      return;
    }

    const permissionToUpdatePost = await hasPermission(
      req.user as LocalUser,
      post,
      'update',
      'Posts'
    );
    if (!permissionToUpdatePost) {
      next(forbiddenError("You don't have permissions to update resource"));
      return;
    }

    if (
      post?.Media &&
      post.Media.length + (req.files.length as number) > MAX_MEDIA_UPLOAD
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

    await uploadFiles({ files, postId, userId: user.id });

    res.status(200).json({
      message: 'successfully uploaded image',
    });
  }),
];

export const uploadPostVideo = [
  videoUpload.array('videos', MAX_MEDIA_UPLOAD),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    if (!req.files && !Array.isArray(req.files)) {
      next(badRequestError('No files provided'));
      return;
    }

    const { postId } = req.params;

    if (!postId) {
      next(badRequestError('Post is required'));
      return;
    }

    const post = await postService.getPost({ id: postId });

    if (!post) {
      next(notFoundError('Post not found'));
      return;
    }

    const permissionToUpdatePost = await hasPermission(
      req.user as LocalUser,
      post,
      'update',
      'Posts'
    );
    if (!permissionToUpdatePost) {
      next(forbiddenError("You don't have permissions to update resource"));
      return;
    }

    if (
      post?.Media &&
      post.Media.length + (req.files.length as number) > MAX_MEDIA_UPLOAD
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

    await uploadFiles({ files, postId, userId: user.id });

    res.status(200).json({
      message: 'successfully uploaded video',
    });
  }),
];

export const likePost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as LocalUser;

    const { postId } = req.params;

    const post = await postService.getPost({ id: postId });

    if (!post) {
      next(notFoundError('Post not found'));
      return;
    }

    const permissionToLike = await hasPermission(user, post, 'like', 'Posts');

    if (!permissionToLike) {
      next(forbiddenError("You don't have permissions to like resource"));
      return;
    }

    postService.likePost({ userId: user.id, postId });

    res.status(200).json({
      message: 'Successfully liked post',
    });
  }
);

export const savePost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as LocalUser;

    const { postId } = req.params;

    const post = await postService.getPost({ id: postId });

    if (!post) {
      next(notFoundError('Post not found'));
      return;
    }

    const permissionToSave = await hasPermission(user, post, 'save', 'Posts');

    if (!permissionToSave) {
      next(forbiddenError("You don't have permissions to save resource"));
      return;
    }

    postService.savePost({ userId: user.id, postId });

    res.status(200).json({
      message: 'Successfully saved post',
    });
  }
);

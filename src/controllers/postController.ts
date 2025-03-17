import { NextFunction, Request, Response } from 'express';
import createPostSchema from '../validations/createPostSchema';
import { User } from '../types/user';
import { prisma } from '../db/client';
import asyncHandler from 'express-async-handler';
import internalError from '../errors/errorTypes/internalError';
import { readFile } from 'fs/promises';
import badRequestError from '../errors/errorTypes/badRequestError';
import uploadStreamToCloudinary from '../utils/uploadStreamToCloudinary';
import { unlink } from 'fs/promises';
import path from 'path';
import notFoundError from '../errors/errorTypes/notFoundError';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { imageUpload, videoUpload } from '../config/multer';

export const createPost = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as User;
  const { content, tags } = createPostSchema.parse(req.body);

  try {
    await prisma.$transaction(async () => {
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

      const post = await prisma.post.create({
        data: {
          content,
          author: {
            connect: {
              id: user.id,
            },
          },
          postTags: {
            connect: postTags,
          },
        },
      });

      res.status(200).json({
        message: 'Successfully created post',
        details: {
          postId: post.id,
        },
      });
    });
  } catch (e) {
    next(internalError('Could not create post'));
  }
});

const MAX_MEDIA_UPLOAD = 3;

export const uploadPostImage = [
  imageUpload.array('images', MAX_MEDIA_UPLOAD),
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

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        Media: true,
      },
    });

    if (
      post?.Media &&
      post.Media.length + (req.files.length as number) >= MAX_MEDIA_UPLOAD
    ) {
      next(
        badRequestError(
          'Maximum amount of resources uploaded to post exceded',
          'MAX_MEDIA'
        )
      );
      return;
    }

    const files = req.files as Express.Multer.File[];

    await Promise.all(
      files.map(async (file) => {
        const filePath = file.path;
        const cloudinaryPath = `uploads/users/${user.id}/posts/${postId}/images`;

        try {
          await prisma.post.update({
            where: {
              id: postId as string,
            },
            data: {
              Media: {
                create: {
                  byteSize: file.size,
                  mimeType: file.mimetype,
                  path: cloudinaryPath,
                },
              },
            },
          });

          const storedFile = await readFile(filePath);
          await uploadStreamToCloudinary(storedFile, {
            folder: cloudinaryPath,
            resource_type: 'image',
            public_id: `file_${Date.now()}`,
          });
        } catch (e) {
          if (e instanceof PrismaClientKnownRequestError) {
            throw notFoundError('Post not found');
          } else {
            throw e;
          }
        } finally {
          await unlink(filePath);
        }
      })
    );

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

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        Media: true,
      },
    });

    if (
      post?.Media &&
      post.Media.length + (req.files.length as number) >= MAX_MEDIA_UPLOAD
    ) {
      next(
        badRequestError(
          'Maximum amount of resources uploaded to post exceded',
          'MAX_MEDIA'
        )
      );
      return;
    }

    const files = req.files as Express.Multer.File[];

    await Promise.all(
      files.map(async (file) => {
        const filePath = file.path;
        const cloudinaryPath = `uploads/users/${user.id}/posts/${postId}/videos`;

        try {
          await prisma.post.update({
            where: {
              id: postId as string,
            },
            data: {
              Media: {
                create: {
                  byteSize: file.size,
                  mimeType: file.mimetype,
                  path: cloudinaryPath,
                },
              },
            },
          });

          const storedFile = await readFile(filePath);
          await uploadStreamToCloudinary(storedFile, {
            folder: cloudinaryPath,
            resource_type: 'video',
            public_id: `file_${Date.now()}`,
          });
        } catch (e) {
          if (e instanceof PrismaClientKnownRequestError) {
            throw notFoundError('Post not found');
          } else {
            throw e;
          }
        } finally {
          await unlink(filePath);
        }
      })
    );

    res.status(200).json({
      message: 'successfully uploaded video',
    });
  }),
];

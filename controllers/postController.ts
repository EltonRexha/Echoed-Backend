import { NextFunction, Request, Response } from 'express';
import createPostSchema from '../validations/createPostSchema';
import { User } from '../types/user';
import { prisma } from '../db/client';
import asyncHandler from 'express-async-handler';
import internalError from '../errors/errorTypes/internalError';
import upload from '../config/multer';
import { readFile } from 'fs/promises';
import badRequestError from '../errors/errorTypes/badRequestError';
import uploadStreamToCloudinary from '../utils/uploadStreamToCloudinary';
import { unlink } from 'fs/promises';
import path from 'path';

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

export const uploadPostImage = [
  upload.array('images', 3),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    if (!req.files && !Array.isArray(req.files)) {
      next(badRequestError('No files provided'));
      return;
    }

    const { postId } = req.params;
    console.log(postId);

    if (!postId) {
      next(badRequestError('Post is required'));
      return;
    }

    const files = req.files as Express.Multer.File[];

    await Promise.all(
      files.map(async (file) => {
        const filePath = file.path;
        const cloudinaryPath = `uploads/users/${user.id}/posts/${postId}/images`;

        await prisma.post.update({
          where: {
            id: postId as string,
          },
          data: {
            media: {
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
        await unlink(filePath);
      })
    );

    res.status(200).json({
      message: 'successfully uploaded image',
    });
  }),
];

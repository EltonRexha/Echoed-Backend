import { postService } from '../services/postService';
import uploadStreamToCloudinary from '../utils/uploadStreamToCloudinary';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import notFoundError from '../errors/errorTypes/notFoundError';
import { unlink, readFile } from 'fs/promises';
import path from 'path';
import { commentService } from '../services/commentService';

async function uploadItem({
  files,
  cloudinaryPath,
  uploadCb,
}: {
  files: Express.Multer.File[];
  cloudinaryPath: string;
  uploadCb: (file: Express.Multer.File, fileName: string) => unknown;
}) {
  await Promise.all(
    files.map(async (file) => {
      const publicId = `/file_${Date.now()}`;
      const filePath = file.path;
      const fileName = `/${publicId}${path
        .extname(file.originalname)
        .toLowerCase()}`;

      let resourceType: 'image' | 'video' | 'raw' = 'image'; // Default to image
      if (file.mimetype.includes('video')) {
        resourceType = 'video';
      } else if (file.mimetype.includes('audio')) {
        resourceType = 'raw'; // Handle audio files as raw
      }

      await uploadCb(file, fileName);

      const storedFile = await readFile(filePath);
      await uploadStreamToCloudinary(storedFile, {
        folder: cloudinaryPath,
        public_id: publicId,
        resource_type: resourceType,
      });

      await unlink(filePath);
    })
  );
}

export namespace uploadFiles {
  export async function post({
    files,
    postId,
    userId,
  }: {
    files: Express.Multer.File[];
    postId: string;
    userId: string;
  }) {
    const cloudinaryPath = `uploads/users/${userId}/posts/${postId}/media/`;

    return uploadItem({
      cloudinaryPath,
      files,
      uploadCb: async (file, fileName) => {
        try {
          console.log(cloudinaryPath, fileName);
          await postService.addMediaToPost({
            id: postId,
            media: {
              size: file.size,
              mimetype: file.mimetype,
              cloudinaryPath: path.posix.join(cloudinaryPath, fileName),
            },
          });
        } catch (e) {
          if (e instanceof PrismaClientKnownRequestError) {
            throw notFoundError('Post not found');
          }
        }
      },
    });
  }

  export async function comment({
    files,
    commentId,
    userId,
  }: {
    files: Express.Multer.File[];
    commentId: string;
    userId: string;
  }) {
    const cloudinaryPath = `uploads/users/${userId}/comments/${commentId}/media/`;

    return uploadItem({
      cloudinaryPath,
      files,
      uploadCb: async (file, fileName) => {
        try {
          await commentService.addMediaToComment({
            id: commentId,
            media: {
              size: file.size,
              mimetype: file.mimetype,
              cloudinaryPath: path.posix.join(cloudinaryPath, fileName),
            },
          });
        } catch (e) {
          if (e instanceof PrismaClientKnownRequestError) {
            throw notFoundError('Comment not found');
          }
        }
      },
    });
  }
}

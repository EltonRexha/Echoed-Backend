import { postService } from '../services/postService';
import uploadStreamToCloudinary from './uploadStreamToCloudinary';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import notFoundError from '../errors/errorTypes/notFoundError';
import { unlink, readFile } from 'fs/promises';
import path from 'path';

export default async function ({
  files,
  postId,
  userId,
}: {
  files: Express.Multer.File[];
  postId: string;
  userId: string;
}) {
  await Promise.all(
    files.map(async (file) => {
      const filePath = file.path;
      const fileName = `/file_${Date.now()}${path.extname(file.originalname).toLowerCase()}`;
      const cloudinaryPath = `uploads/users/${userId}/posts/${postId}/videos/`;

      let resourceType: 'image' | 'video' | 'raw' = 'image'; // Default to image
      if (file.mimetype.includes('video')) {
        resourceType = 'video';
      } else if (file.mimetype.includes('audio')) {
        resourceType = 'raw'; // Handle audio files as raw
      }

      try {
        await postService.addMediaToPost({
          id: postId,
          media: {
            size: file.size,
            mimetype: file.mimetype,
            cloudinaryPath: path.join(cloudinaryPath, fileName),
          },
        });

        const storedFile = await readFile(filePath);
        await uploadStreamToCloudinary(storedFile, {
          folder: cloudinaryPath,
          public_id: `file_${Date.now()}`,
          resource_type: resourceType
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
}

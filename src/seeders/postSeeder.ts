import { Post, Roles } from '@prisma/client';
import { faker } from '@faker-js/faker';
import Seeder, { SeederDataList } from '../types/seeder.interface';
import _ from 'lodash';
import { postService } from '../services/postService';
import axios from 'axios';
import { uploadFiles } from '../services/uploadFilesService';
import * as path from 'path';
import * as fs from 'fs';
import { writeFile } from 'fs/promises';
import { tmpFolder } from '../config/multer';
import { v4 as uuid } from 'uuid';

export class PostSeeder implements Seeder {
  private generatePost(userId: string, mainPostId?: string) {
    const post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
      content: faker.lorem.paragraphs({ min: 2, max: 4 }),
      mainPostId: mainPostId || null,
      userId,
    };

    return post;
  }

  private async fetchPlaceholderImage(): Promise<Express.Multer.File> {
    try {
      const width = _.random(300, 800);
      const height = _.random(300, 800);

      const randomSeed = _.random(1, 100);

      const imageUrl = `https://picsum.photos/seed/${randomSeed}/${width}/${height}`;
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });

      const tmpFilePath = path.join(tmpFolder, `file_${uuid()}.jpg`);

      await writeFile(tmpFilePath, Buffer.from(response.data as ArrayBuffer));

      const file: Express.Multer.File = {
        fieldname: 'image',
        originalname: `seed-image-${randomSeed}.jpg`,
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: tmpFolder,
        filename: path.basename(tmpFilePath),
        path: tmpFilePath,
        size: Buffer.from(response.data as ArrayBuffer).length,
        buffer: Buffer.from(response.data as ArrayBuffer),
        stream: fs.createReadStream(tmpFilePath),
      } as any;

      return file;
    } catch (error) {
      console.error('Error fetching placeholder image:', error);
      throw error;
    }
  }

  private async seedPost(
    tagsIds: string[],
    userId?: string,
    mainPostId?: string,
    likedByUsersIds?: string[],
    savedByUserIds?: string[],
    addMedia?: boolean
  ) {
    if (!userId) {
      throw new Error('Seeder error: trying to create a post without a user');
    }

    const post = this.generatePost(userId, mainPostId);

    const createPost = await postService.createPost({
      content: post.content,
      tags: tagsIds.map((tag) => ({ id: tag })),
      userId: userId,
      mainPostId: post.mainPostId || undefined,
    });

    if (likedByUsersIds) {
      await Promise.all(
        likedByUsersIds.map(async (userId) => {
          await postService.likePost({ userId, postId: createPost.id });
        })
      );
    }

    if (savedByUserIds) {
      await Promise.all(
        savedByUserIds.map(async (userId) => {
          await postService.savePost({ userId, postId: createPost.id });
        })
      );
    }

    if (addMedia) {
      const mediaLength = _.random(0, 3);
      console.log(`Fetching ${mediaLength} images`);
      try {
        for (let i = 0; i < mediaLength; i++) {

          console.log(`Fetching image ${i + 1}`);
          const imageFile = await this.fetchPlaceholderImage();
          console.log(`Fetching image ${i + 1} done`);

          console.log(`uploading image ${i + 1}`);

          await uploadFiles.post({
            files: [imageFile],
            postId: createPost.id,
            userId: userId,
          });

          console.log(`uploading image ${i + 1} done`);
        }
        console.log(`Fetching ${mediaLength} images`);
      } catch (error) {
        console.error('Error adding media to post:', error);
        // Continue with post creation even if media upload fails
      }
    }

    return createPost.id;
  }

  public async seed(amount: number, prevSeedIds: SeederDataList) {
    console.log(`Seeding posts... [amount: ${amount}]`);
    const ids: string[] = [];
    for (let i = 1; i <= amount; i++) {
      console.log(`Seeding post ${i}`);
      const prevUserIds = prevSeedIds['user'];
      const postId = await this.seedPost(
        _.sampleSize(prevSeedIds['tags'], _.random(0, 10)),
        _.sample(prevUserIds),
        Math.floor(Math.random() * 2) === 1 ? _.sample(ids) : undefined,
        _.sampleSize(prevUserIds, _.random(0, prevUserIds.length)),
        _.sampleSize(prevUserIds, _.random(0, prevUserIds.length)),
        true // Always add media to make sure images are uploaded
      );
      ids.push(postId);
    }
    console.log('finished seeding posts');
    return ids;
  }
}

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

      const tmpFilePath = path.join(tmpFolder, `myFile_${uuid()}.jpg`);

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

  private async fetchPlaceholderVideo(): Promise<Express.Multer.File> {
    try {
      const randomSeed = _.random(1, 10);
      const videoUrl = `https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`;

      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
      });

      const tmpFilePath = path.join(tmpFolder, `myFile_${uuid()}.mp4`);
      await writeFile(tmpFilePath, Buffer.from(response.data as ArrayBuffer));

      const file: Express.Multer.File = {
        fieldname: 'video',
        originalname: `seed-video-${randomSeed}.mp4`,
        encoding: '7bit',
        mimetype: 'video/mp4',
        destination: tmpFolder,
        filename: path.basename(tmpFilePath),
        path: tmpFilePath,
        size: Buffer.from(response.data as ArrayBuffer).length,
        buffer: Buffer.from(response.data as ArrayBuffer),
        stream: fs.createReadStream(tmpFilePath),
      } as any;

      return file;
    } catch (error) {
      console.error('Error fetching placeholder video:', error);
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
      const imageLength = _.random(0, 3);
      console.log(`Fetching ${imageLength} images`);
      try {
        for (let i = 0; i < imageLength; i++) {
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
        console.log(`Fetching ${imageLength} images`);

        const videoLength = _.random(0, 1);
        console.log(`Fetching ${videoLength} videos`);
        for (let i = 0; i < videoLength; i++) {
          console.log(`Fetching video ${i + 1}`);
          const videoFile = await this.fetchPlaceholderVideo();
          console.log(`Fetching video ${i + 1} done`);

          console.log(`uploading video ${i + 1}`);
          await uploadFiles.post({
            files: [videoFile],
            postId: createPost.id,
            userId: userId,
          });
          console.log(`uploading video ${i + 1} done`);
        }
        console.log(`Fetching ${videoLength} videos done`);
      } catch (error) {
        console.error('Error adding media to post:', error);
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
        true
      );
      ids.push(postId);
    }
    console.log('finished seeding posts');
    return ids;
  }
}

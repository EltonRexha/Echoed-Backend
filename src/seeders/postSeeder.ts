import { Post, Roles } from '@prisma/client';
import { faker } from '@faker-js/faker';
import Seeder, { SeederDataList } from '../types/seeder.interface';
import _ from 'lodash';
import { postService } from '../services/postService';

export class PostSeeder implements Seeder {
  private generatePost(userId: string, mainPostId?: string) {
    const post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
      content: faker.lorem.paragraphs({ min: 3, max: 10 }),
      mainPostId: mainPostId || null,
      userId,
    };

    return post;
  }

  private async seedPost(
    tagsIds: string[],
    userId?: string,
    mainPostId?: string,
    likedByUsersIds?: string[],
    savedByUserIds?: string[]
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
        _.sampleSize(prevUserIds, _.random(0, prevUserIds.length))
      );
      ids.push(postId);
    }
    console.log('finished seeding posts');
    return ids;
  }
}

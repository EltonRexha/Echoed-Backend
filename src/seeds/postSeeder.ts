import { Post, Roles } from '@prisma/client';
import { faker } from '@faker-js/faker';
import Seeder, { SeederDataList } from '../types/seeder.interface';
import _ from 'lodash';
import { userService } from '../services/userService';
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

  private async seedPost(tagsIds: string[], userId?: string, postId?: string) {
    if (!userId) {
      throw new Error('Seeder error: trying to create a post without a user');
    }

    const post = this.generatePost(userId, postId);

    const createPost = await postService.createPost({
      content: post.content,
      tags: tagsIds.map((tag) => ({ id: tag })),
      userId: userId,
      mainPostId: post.mainPostId || undefined,
    });
    return createPost.id;
  }

  public async seed(amount: number, prevSeedIds: SeederDataList) {
    console.log(`Seeding posts... [amount: ${amount}]`);
    const ids: string[] = [];
    for (let i = 1; i <= amount; i++) {
      console.log(`Seeding post ${i}`);
      const postId = await this.seedPost(
        _.sampleSize(prevSeedIds['tags'], _.random(0, 10)),
        _.sample(prevSeedIds['user']),
        Math.floor(Math.random() * 2) === 1 ? _.sample(ids) : undefined
      );
      ids.push(postId);
    }
    console.log('finished seeding posts');
    return ids;
  }
}

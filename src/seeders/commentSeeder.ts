import { Post, PostComment } from '@prisma/client';
import { faker } from '@faker-js/faker';
import Seeder, { SeederDataList } from '../types/seeder.interface';
import _ from 'lodash';
import { commentService } from '../services/commentService';

export class CommentSeeder implements Seeder {
  private generateComment(
    userId: string,
    postId: string,
    mainCommentId?: string
  ) {
    const comment: Omit<PostComment, 'id' | 'createdAt' | 'updatedAt'> = {
      content: faker.lorem.paragraphs({ min: 1, max: 3 }),
      postId: postId,
      authorId: userId,
      parentCommentId: mainCommentId || null,
    };

    return comment;
  }

  private async seedComment(
    userId?: string,
    postId?: string,
    mainCommentId?: string
  ) {
    if (!userId) {
      throw new Error(
        'Seeder error: trying to create a comment without a user'
      );
    }

    if (!postId) {
      throw new Error(
        'Seeder error: trying to create a comment without a post'
      );
    }

    const comment = this.generateComment(userId, postId, mainCommentId);

    const createComment = await commentService.createComment({
      content: comment.content,
      postId: comment.postId,
      userId: comment.authorId,
      parentCommentId: comment.parentCommentId || undefined,
    });
    return createComment.id;
  }

  public async seed(amount: number, prevSeedIds: SeederDataList) {
    console.log(`Seeding comments... [amount: ${amount}]`);
    const ids: string[] = [];
    for (let i = 1; i <= amount; i++) {
      console.log(`Seeding comments ${i}`);
      const postId = await this.seedComment(
        _.sample(prevSeedIds['user']),
        _.sample(prevSeedIds['post']),
        Math.floor(Math.random() * 2) === 1 ? _.sample(ids) : undefined
      );
      ids.push(postId);
    }
    console.log('finished seeding posts');
    return ids;
  }
}

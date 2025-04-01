import { faker } from '@faker-js/faker';
import Seeder, { SeederDataList } from '../types/seeder.interface';
import _ from 'lodash';
import { postTagsService } from '../services/postTagService';

export class TagSeeder implements Seeder {
  private async generateTag() {
    //Get a random country, state, event, and more
    let exists = true;

    let randomTag: string = _.sample([
      faker.location.country(),
      faker.location.state(),
      faker.lorem.words(2),
      faker.commerce.department(),
      faker.date.past().getFullYear().toString(),
      faker.word.noun(),
    ]);

    while (exists) {
      randomTag = _.sample([
        faker.location.country(),
        faker.location.state(),
        faker.lorem.words(2),
        faker.commerce.department(),
        faker.date.past().getFullYear().toString(),
        faker.word.noun(),
      ]);

      exists = await postTagsService.postTagExists(randomTag);
    }

    return randomTag;
  }

  private async seedTags() {
    const randomTag = await this.generateTag();
    const postTag = await postTagsService.createPostTag(randomTag);

    return postTag.id;
  }

  public async seed(amount: number, prevSeedIds: SeederDataList) {
    console.log(`Seeding post tags... [amount: ${amount}]`);
    const ids: string[] = [];
    for (let i = 1; i <= amount; i++) {
      console.log(`Seeding post tag ${i}`);
      const tagId = await this.seedTags();
      ids.push(tagId);
    }
    console.log('finished seeding posts');
    return ids;
  }
}

import { Roles, User, UserInfo } from '@prisma/client';
import { faker } from '@faker-js/faker';
import Seeder from '../types/seeder.interface';
import _ from 'lodash';
import { userService } from '../services/userService';

export class UserSeeder implements Seeder {
  private generateUser() {
    const user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> &
      Omit<UserInfo, 'id' | 'createdAt' | 'updatedAt'> = {
      username: faker.internet.displayName(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      userStatus: 'active',
      verified: true,
      UserType: 'local',
      userInfoId: '1',
      mediaId: null,
      password: 'password_placeholder',
      Roles: [faker.helpers.arrayElement(['admin', 'moderator', 'user'])],
      country: faker.location.country(),
      dateOfBirth: faker.date.birthdate(),
      gender: faker.helpers.arrayElement(['female', 'male', 'other']),
    };

    return user;
  }

  private async seedUser() {
    const user = this.generateUser();

    const createdUser = await userService.createLocalUser({
      firstName: user.firstName,
      lastName: user.lastName,
      country: user.country,
      dateOfBirth: user.dateOfBirth,
      email: user.email,
      gender: user.gender,
      username: user.username,
      roles: user.Roles,
      verified: user.verified,
    });
    return createdUser.id;
  }

  public async seed(amount: number) {
    console.log(`Seeding user... [amount: ${amount}]`);
    const ids: string[] = [];
    for (let i = 1; i <= amount; i++) {
      console.log(`Seeding user ${i}`);
      const userId = await this.seedUser();
      ids.push(userId);
    }
    console.log('finished seeding user');
    return ids;
  }
}

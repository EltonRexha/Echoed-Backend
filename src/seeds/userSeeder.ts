import { Roles, User, UserInfo } from '@prisma/client';
import { faker } from '@faker-js/faker';
import Seeder from '../types/seeder.interface';
import _ from 'lodash';
import { userService } from '../services/userService';

export class UserSeeder implements Seeder {
  public constructor() {}

  private generateUser() {
    const someRecentDate = faker.date.recent();
    const user: Omit<User, 'id'> & Omit<UserInfo, 'id'> = {
      createdAt: someRecentDate,
      updatedAt: someRecentDate,
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

    await userService.createLocalUser({
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
    return;
  }

  public async seed(amount: number) {
    console.log(`Seeding user... [amount: ${amount}]`);
    for (let i = 1; i <= amount; i++) {
      console.log(`Seeding user ${i}`);
      await this.seedUser();
    }
    console.log('finished seeding user');
    return;
  }
}

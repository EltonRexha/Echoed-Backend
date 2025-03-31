import { prisma } from '../db/client';
import Seeder, { SeederDataList, SeederNames } from '../types/seeder.interface';
import { PostSeeder } from './postSeeder';
import { UserSeeder } from './userSeeder';

const userSeeder = new UserSeeder();
const postSeeder = new PostSeeder();

seed(
  {
    amount: 100,
    seeder: userSeeder,
    seederName: 'user',
  },
  {
    amount: 100,
    seeder: postSeeder,
    seederName: 'post',
  }
).then(() => {
  console.log('all seeding done');
  process.exit(0);
});

async function seed(
  ...seederObjs: { seeder: Seeder; amount: number; seederName: SeederNames }[]
) {
  let seederData: SeederDataList = { user: [], post: [] };
  for (let seederObj of seederObjs) {
    const ids = await seederObj.seeder.seed(seederObj.amount, seederData);
    seederData[seederObj.seederName] = ids;
  }
  console.log('disconnecting from db');
  prisma.$disconnect();
  return;
}

import { prisma } from '../db/client';
import Seeder, { SeederDataList, SeederNames } from '../types/seeder.interface';
import { CommentSeeder } from './commentSeeder';
import { PostSeeder } from './postSeeder';
import { UserSeeder } from './userSeeder';

const userSeeder = new UserSeeder();
const postSeeder = new PostSeeder();
const commentSeeder = new CommentSeeder();

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
  },
  {
    amount: 100,
    seeder: commentSeeder,
    seederName: 'comment',
  }
).then(() => {
  console.log('all seeding done');
  process.exit(0);
});

async function seed(
  ...seederObjs: { seeder: Seeder; amount: number; seederName: SeederNames }[]
) {
  let seederData: SeederDataList = { user: [], post: [], comment: [] };
  for (let seederObj of seederObjs) {
    const ids = await seederObj.seeder.seed(seederObj.amount, seederData);
    seederData[seederObj.seederName] = ids;
  }
  console.log('disconnecting from db');
  prisma.$disconnect();
  return;
}

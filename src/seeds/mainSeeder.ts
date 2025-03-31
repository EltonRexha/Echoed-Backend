import { prisma } from '../db/client';
import Seeder from '../types/seeder.interface';
import { UserSeeder } from './userSeeder';

const userSeeder = new UserSeeder();

seed({
  amount: 100,
  seeder: userSeeder,
}).then(() => {
    console.log('all seeding done');
    process.exit(0);
});

async function seed(...seederObjs: { seeder: Seeder; amount: number }[]) {
  for (let seederObj of seederObjs) {
    await seederObj.seeder.seed(seederObj.amount);
  }
  console.log('disconnecting from db');
  prisma.$disconnect();
  return;
}
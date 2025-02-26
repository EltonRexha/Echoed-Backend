/*
  Warnings:

  - Added the required column `userCompleted` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "userInformation" ALTER COLUMN "country" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userCompleted" BOOLEAN NOT NULL,
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

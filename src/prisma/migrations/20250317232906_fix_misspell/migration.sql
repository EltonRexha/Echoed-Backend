/*
  Warnings:

  - The values [unkown] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `user_prefered_tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('male', 'female', 'other', 'unknown');
ALTER TABLE "userInformation" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "Gender_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "user_prefered_tags" DROP CONSTRAINT "user_prefered_tags_postTagsId_fkey";

-- DropForeignKey
ALTER TABLE "user_prefered_tags" DROP CONSTRAINT "user_prefered_tags_userId_fkey";

-- DropTable
DROP TABLE "user_prefered_tags";

-- CreateTable
CREATE TABLE "user_userPreferredTag_tags" (
    "id" TEXT NOT NULL,
    "postTagsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "popularity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_userPreferredTag_tags_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_userPreferredTag_tags" ADD CONSTRAINT "user_userPreferredTag_tags_postTagsId_fkey" FOREIGN KEY ("postTagsId") REFERENCES "post_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_userPreferredTag_tags" ADD CONSTRAINT "user_userPreferredTag_tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

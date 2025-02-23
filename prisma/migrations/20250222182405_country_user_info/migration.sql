/*
  Warnings:

  - Added the required column `country` to the `userInformation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "userInformation" ADD COLUMN     "country" TEXT NOT NULL;

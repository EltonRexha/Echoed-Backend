/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `github_users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `github_users` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "github_users" ADD COLUMN     "email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "github_users_email_key" ON "github_users"("email");

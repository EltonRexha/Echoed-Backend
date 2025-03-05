-- AlterTable
ALTER TABLE "github_users" ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "google_users" ALTER COLUMN "first_name" DROP NOT NULL;

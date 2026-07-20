-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'GOOGLE_DRIVE');

-- AlterTable
ALTER TABLE "Recording" ADD COLUMN     "provider" "VideoProvider" NOT NULL DEFAULT 'YOUTUBE';

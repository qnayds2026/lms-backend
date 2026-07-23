/*
  Warnings:

  - You are about to drop the column `provider` on the `Recording` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Recording" DROP COLUMN "provider";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activationExpires" TIMESTAMP(3),
ADD COLUMN     "activationToken" TEXT,
ALTER COLUMN "isActive" SET DEFAULT false;

-- DropEnum
DROP TYPE "VideoProvider";

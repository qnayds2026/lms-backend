/*
  Warnings:

  - You are about to drop the column `whatsappGroupLink` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "whatsappGroupLink",
ADD COLUMN     "communityLink" TEXT;

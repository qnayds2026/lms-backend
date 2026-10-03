-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('ONGOING', 'COMPLETED');

-- AlterTable
ALTER TABLE "Certificate" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'ONGOING';

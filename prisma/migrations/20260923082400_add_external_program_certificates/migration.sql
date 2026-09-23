/*
  Warnings:

  - A unique constraint covering the columns `[programRegistrationId]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('WEBINAR', 'INTERNSHIP', 'WORKSHOP');

-- CreateEnum
CREATE TYPE "CertificateRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('COURSE', 'WEBINAR', 'INTERNSHIP', 'WORKSHOP');

-- AlterTable
ALTER TABLE "Certificate"
ADD COLUMN "programRegistrationId" INTEGER,
ADD COLUMN "type" "CertificateType" NOT NULL DEFAULT 'COURSE',
ALTER COLUMN "courseId" DROP NOT NULL,
ALTER COLUMN "enrollmentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProgramType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramRegistration" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "studentId" INTEGER,
    "programId" INTEGER NOT NULL,
    "certificateRequestStatus" "CertificateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Program_type_idx" ON "Program"("type");

-- CreateIndex
CREATE INDEX "ProgramRegistration_email_idx" ON "ProgramRegistration"("email");

-- CreateIndex
CREATE INDEX "ProgramRegistration_studentId_idx" ON "ProgramRegistration"("studentId");

-- CreateIndex
CREATE INDEX "ProgramRegistration_programId_idx" ON "ProgramRegistration"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramRegistration_programId_email_key" ON "ProgramRegistration"("programId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_programRegistrationId_key" ON "Certificate"("programRegistrationId");

-- CreateIndex
CREATE INDEX "Certificate_type_idx" ON "Certificate"("type");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_programRegistrationId_fkey" FOREIGN KEY ("programRegistrationId") REFERENCES "ProgramRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramRegistration" ADD CONSTRAINT "ProgramRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramRegistration" ADD CONSTRAINT "ProgramRegistration_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

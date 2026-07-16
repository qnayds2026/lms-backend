-- CreateTable
CREATE TABLE "ModuleAttachment" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moduleId" INTEGER NOT NULL,

    CONSTRAINT "ModuleAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModuleAttachment_moduleId_idx" ON "ModuleAttachment"("moduleId");

-- AddForeignKey
ALTER TABLE "ModuleAttachment" ADD CONSTRAINT "ModuleAttachment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

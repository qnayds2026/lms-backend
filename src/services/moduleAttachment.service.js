const prisma = require("../lib/prisma");

const createAttachment = async (moduleId, title, fileUrl, fileType) => {
  return await prisma.moduleAttachment.create({
    data: {
      moduleId: Number(moduleId),
      title,
      fileUrl,
      fileType,
    },
  });
};

const getAttachmentsByModule = async (moduleId) => {
  return await prisma.moduleAttachment.findMany({
    where: {
      moduleId: Number(moduleId),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const deleteAttachment = async (id) => {
  const attachment = await prisma.moduleAttachment.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  await prisma.moduleAttachment.delete({
    where: {
      id: Number(id),
    },
  });

  return attachment;
};

module.exports = {
  createAttachment,
  getAttachmentsByModule,
  deleteAttachment,
};

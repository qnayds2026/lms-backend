const prisma = require("../lib/prisma");

const createModuleNote = async (moduleId, userId, noteData) => {
  const { title, description, referenceVideo, referenceLink } = noteData;

  // Check module exists
  const module = await prisma.courseModule.findUnique({
    where: {
      id: Number(moduleId),
    },
  });

  if (!module) {
    throw new Error("Module not found");
  }

  const note = await prisma.moduleNote.create({
    data: {
      title,
      description,
      referenceVideo,
      referenceLink,
      moduleId: Number(moduleId),
      createdBy: userId,
    },
  });

  return note;
};

const getModuleNotes = async (moduleId) => {
  const notes = await prisma.moduleNote.findMany({
    where: {
      moduleId: Number(moduleId),
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return notes;
};

const updateModuleNote = async (noteId, noteData, userId, userRole) => {
  const note = await prisma.moduleNote.findUnique({
    where: {
      id: Number(noteId),
    },
  });

  if (!note) {
    throw new Error("Note not found");
  }

  if (userRole !== "ADMIN" && note.createdBy !== userId) {
    throw new Error("You are not authorized to edit this note.");
  }

  if (!note) {
    throw new Error("Note not found");
  }

  return await prisma.moduleNote.update({
    where: {
      id: Number(noteId),
    },
    data: noteData,
  });
};

const deleteModuleNote = async (noteId, userId, userRole) => {
  const note = await prisma.moduleNote.findUnique({
    where: {
      id: Number(noteId),
    },
  });

  if (!note) {
    throw new Error("Note not found");
  }

  if (userRole !== "ADMIN" && note.createdBy !== userId) {
    throw new Error("You are not authorized to delete this note.");
  }

  if (!note) {
    throw new Error("Note not found");
  }

  await prisma.moduleNote.delete({
    where: {
      id: Number(noteId),
    },
  });

  return true;
};

module.exports = {
  createModuleNote,
  getModuleNotes,
  updateModuleNote,
  deleteModuleNote,
};

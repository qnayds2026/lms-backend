const prisma = require("../lib/prisma");

// Create Program
const createProgram = async (data) => {
  const { title, description, type, startDate, endDate, isActive } = data;

  if (!title) {
    throw new Error("Program title is required");
  }

  if (!type) {
    throw new Error("Program type is required");
  }

  const program = await prisma.program.create({
    data: {
      title,
      description,
      type,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive: isActive ?? true,
    },
  });

  return program;
};

// Get All Programs
const getAllPrograms = async () => {
  return await prisma.program.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Get Single Program
const getProgramById = async (id) => {
  const program = await prisma.program.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!program) {
    throw new Error("Program not found");
  }

  return program;
};

// Update Program
const updateProgram = async (id, data) => {
  const existingProgram = await prisma.program.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!existingProgram) {
    throw new Error("Program not found");
  }

  const { title, description, type, startDate, endDate, isActive } = data;

  const updatedProgram = await prisma.program.update({
    where: {
      id: Number(id),
    },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(endDate !== undefined && {
        endDate: endDate ? new Date(endDate) : null,
      }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return updatedProgram;
};

// Activate Program
const activateProgram = async (id) => {
  const existingProgram = await prisma.program.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!existingProgram) {
    throw new Error("Program not found");
  }

  return await prisma.program.update({
    where: {
      id: Number(id),
    },
    data: {
      isActive: true,
    },
  });
};

// Deactivate Program
const deactivateProgram = async (id) => {
  const existingProgram = await prisma.program.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!existingProgram) {
    throw new Error("Program not found");
  }

  return await prisma.program.update({
    where: {
      id: Number(id),
    },
    data: {
      isActive: false,
    },
  });
};

module.exports = {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  activateProgram,
  deactivateProgram,
};

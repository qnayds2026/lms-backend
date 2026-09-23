const prisma = require("../lib/prisma");

// Register for a Program
const registerForProgram = async (programId, data) => {
  const { name, email, phone } = data;

  if (!name) {
    throw new Error("Name is required");
  }

  if (!email) {
    throw new Error("Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  const program = await prisma.program.findUnique({
    where: {
      id: Number(programId),
    },
  });

  if (!program) {
    throw new Error("Program not found");
  }

  if (!program.isActive) {
    throw new Error("Program is not active");
  }

  const existingRegistration = await prisma.programRegistration.findUnique({
    where: {
      programId_email: {
        programId: Number(programId),
        email,
      },
    },
  });

  if (existingRegistration) {
    throw new Error("You have already registered for this program");
  }

  const registration = await prisma.programRegistration.create({
    data: {
      name,
      email,
      phone,
      programId: Number(programId),
    },
  });

  return registration;
};

// Get All Registrations for a Program
const getRegistrationsByProgram = async (programId) => {
  const program = await prisma.program.findUnique({
    where: {
      id: Number(programId),
    },
  });

  if (!program) {
    throw new Error("Program not found");
  }

  return await prisma.programRegistration.findMany({
    where: {
      programId: Number(programId),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Get Single Registration
const getRegistrationById = async (id) => {
  const registration = await prisma.programRegistration.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      program: true,
    },
  });

  if (!registration) {
    throw new Error("Registration not found");
  }

  return registration;
};

// Search Registration by Email
const searchRegistrationByEmail = async (email) => {
  if (!email) {
    throw new Error("Email is required for search");
  }

  const registrations = await prisma.programRegistration.findMany({
    where: {
      email: {
        contains: email,
        mode: "insensitive",
      },
    },
    include: {
      program: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return registrations;
};

// Get Registration Status
const getRegistrationStatus = async (id) => {
  const registration = await prisma.programRegistration.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      id: true,
      certificateRequestStatus: true,
    },
  });

  if (!registration) {
    throw new Error("Registration not found");
  }

  return registration;
};

module.exports = {
  registerForProgram,
  getRegistrationsByProgram,
  getRegistrationById,
  searchRegistrationByEmail,
  getRegistrationStatus,
};
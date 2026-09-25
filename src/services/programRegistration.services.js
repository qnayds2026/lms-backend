const crypto = require("crypto");
const prisma = require("../lib/prisma");

// ==========================================
// Registration (Task 2)
// ==========================================

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
    const error = new Error("Program not found");
    error.statusCode = 404;
    throw error;
  }

  if (!program.isActive) {
    const error = new Error("Program is not active");
    error.statusCode = 400;
    throw error;
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
    const error = new Error("You have already registered for this program");
    error.statusCode = 400;
    throw error;
  }

  // Check if student exists with this email to link immediately
  const existingUser = await prisma.user.findUnique({
    where: { email: email.trim() },
  });

  const registration = await prisma.programRegistration.create({
    data: {
      name,
      email,
      phone,
      programId: Number(programId),
      ...(existingUser ? { studentId: existingUser.id } : {}),
    },
  });

  return registration;
};

// ==========================================
// Admin — View registrations (Task 3)
// ==========================================

const getRegistrationsByProgram = async (programId) => {
  const program = await prisma.program.findUnique({
    where: {
      id: Number(programId),
    },
  });

  if (!program) {
    const error = new Error("Program not found");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.programRegistration.findMany({
    where: {
      programId: Number(programId),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      certificate: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

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

// ==========================================
// Dilshad: Student <-> Certificate flow
// ==========================================

const matchRegistrationsByEmail = async (userId, email) => {
  if (!userId || !email) return;

  const normalizedEmail = email.trim();

  await prisma.programRegistration.updateMany({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
    data: {
      studentId: Number(userId),
    },
  });
};

const getMyProgramRegistrations = async (studentId) => {
  const registrations = await prisma.programRegistration.findMany({
    where: {
      studentId: Number(studentId),
    },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      },
      certificate: {
        select: {
          id: true,
          certificateNumber: true,
          verificationCode: true,
          type: true,
          issuedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return registrations;
};

const formatCertificateRequest = (reg) => ({
  id: reg.id,
  studentId: reg.studentId,
  studentName: reg.student?.name || reg.name,
  name: reg.name,
  email: reg.student?.email || reg.email,
  phone: reg.student?.phone || reg.phone,
  program: reg.program?.title || null,
  programId: reg.programId,
  programType: reg.program?.type || null,
  registrationDate: reg.createdAt,
  createdAt: reg.createdAt,
  updatedAt: reg.updatedAt,
  requestStatus: reg.certificateRequestStatus,
  certificateRequestStatus: reg.certificateRequestStatus,
  certificate: reg.certificate || null,
  programDetails: reg.program || null,
  studentDetails: reg.student || null,
});

const requestCertificate = async (studentId, registrationId) => {
  const regId = Number(registrationId);
  if (isNaN(regId)) {
    const error = new Error("Invalid registration ID");
    error.statusCode = 400;
    throw error;
  }

  const registration = await prisma.programRegistration.findUnique({
    where: { id: regId },
    include: {
      certificate: true,
      program: true,
    },
  });

  if (!registration) {
    const error = new Error("Program registration not found");
    error.statusCode = 404;
    throw error;
  }

  if (registration.studentId !== Number(studentId)) {
    const error = new Error("Unauthorized. You do not own this registration");
    error.statusCode = 403;
    throw error;
  }

  if (
    registration.certificate ||
    registration.certificateRequestStatus === "APPROVED"
  ) {
    const error = new Error(
      "Certificate has already been issued for this registration",
    );
    error.statusCode = 400;
    throw error;
  }

  const updatedRegistration = await prisma.programRegistration.update({
    where: { id: regId },
    data: {
      certificateRequestStatus: "PENDING",
    },
    include: {
      program: true,
      certificate: true,
    },
  });

  return updatedRegistration;
};

const getAllCertificateRequests = async (status) => {
  const where = {};
  if (status) {
    where.certificateRequestStatus = status;
  }

  const requests = await prisma.programRegistration.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      program: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          startDate: true,
          endDate: true,
        },
      },
      certificate: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map(formatCertificateRequest);
};

const getCertificateRequestById = async (registrationId) => {
  const regId = Number(registrationId);
  if (isNaN(regId)) {
    const error = new Error("Invalid certificate request ID");
    error.statusCode = 400;
    throw error;
  }

  const registration = await prisma.programRegistration.findUnique({
    where: { id: regId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      program: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          startDate: true,
          endDate: true,
        },
      },
      certificate: true,
    },
  });

  if (!registration) {
    const error = new Error("Certificate request not found");
    error.statusCode = 404;
    throw error;
  }

  return formatCertificateRequest(registration);
};

const generateProgramCertificateNumber = async (programId, type) => {
  const year = new Date().getFullYear();
  const count = await prisma.certificate.count();
  return `QNAYDS-${year}-${type || "PRG"}-${String(Number(programId)).padStart(
    3,
    "0",
  )}-${String(count + 1).padStart(5, "0")}`;
};

const approveCertificateRequest = async (registrationId) => {
  const regId = Number(registrationId);
  if (isNaN(regId)) {
    const error = new Error("Invalid registration ID");
    error.statusCode = 400;
    throw error;
  }

  const registration = await prisma.programRegistration.findUnique({
    where: { id: regId },
    include: {
      student: true,
      program: true,
      certificate: true,
    },
  });

  if (!registration) {
    const error = new Error("Program registration not found");
    error.statusCode = 404;
    throw error;
  }

  if (registration.certificateRequestStatus === "APPROVED") {
    const error = new Error("Certificate request is already approved");
    error.statusCode = 400;
    throw error;
  }

  let studentId = registration.studentId;
  if (!studentId) {
    const user = await prisma.user.findUnique({
      where: { email: registration.email },
    });
    if (user) {
      studentId = user.id;
    }
  }

  const updatedRegistration = await prisma.programRegistration.update({
    where: { id: regId },
    data: {
      certificateRequestStatus: "APPROVED",
      ...(studentId ? { studentId } : {}),
    },
    include: {
      student: true,
      program: true,
      certificate: true,
    },
  });

  let certificate = updatedRegistration.certificate;
  if (!certificate && studentId) {
    const certificateNumber = await generateProgramCertificateNumber(
      registration.programId,
      registration.program.type,
    );
    const verificationCode = crypto.randomBytes(16).toString("hex");

    certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        verificationCode,
        type: registration.program.type,
        studentId: Number(studentId),
        programRegistrationId: registration.id,
        issuedAt: new Date(),
      },
    });
  }

  return {
    ...formatCertificateRequest(updatedRegistration),
    certificate,
  };
};

const rejectCertificateRequest = async (registrationId) => {
  const regId = Number(registrationId);
  if (isNaN(regId)) {
    const error = new Error("Invalid registration ID");
    error.statusCode = 400;
    throw error;
  }

  const registration = await prisma.programRegistration.findUnique({
    where: { id: regId },
    include: {
      student: true,
      program: true,
      certificate: true,
    },
  });

  if (!registration) {
    const error = new Error("Program registration not found");
    error.statusCode = 404;
    throw error;
  }

  if (registration.certificateRequestStatus === "REJECTED") {
    const error = new Error("Certificate request is already rejected");
    error.statusCode = 400;
    throw error;
  }

  const updatedRegistration = await prisma.programRegistration.update({
    where: { id: regId },
    data: {
      certificateRequestStatus: "REJECTED",
    },
    include: {
      student: true,
      program: true,
      certificate: true,
    },
  });

  return formatCertificateRequest(updatedRegistration);
};

module.exports = {
  registerForProgram,
  getRegistrationsByProgram,
  getRegistrationById,
  searchRegistrationByEmail,
  getRegistrationStatus,
  matchRegistrationsByEmail,
  registerForProgram,
  getRegistrationsByProgram,
  getRegistrationById,
  searchRegistrationByEmail,
  getRegistrationStatus,
  getMyProgramRegistrations,
  requestCertificate,
  getAllCertificateRequests,
  getCertificateRequestById,
};

const crypto = require("crypto");
const prisma = require("../lib/prisma");

/**
 * Match external program registrations to an LMS student account by email.
 * Connects registrations using ProgramRegistration.studentId = User.id.
 */
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

/**
 * Get registered programs for the logged-in student.
 * Returns student's registered programs, program details, and certificate request status.
 */
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

/**
 * Format certificate request output for admin APIs.
 * Shows student name, email, program, program type, registration date, and request status.
 */
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

/**
 * Allow a student to request a certificate for an external program registration.
 * - Verify the logged-in student owns the registration.
 * - Verify the registration exists.
 * - Verify that a certificate has not already been issued.
 * - Allow the certificate request.
 * - Keep the request status as PENDING.
 */
const requestCertificate = async (studentId, registrationId) => {
  const regId = Number(registrationId);
  if (isNaN(regId)) {
    const error = new Error("Invalid registration ID");
    error.statusCode = 400;
    throw error;
  }

  // 1. Verify the registration exists
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

  // 2. Verify the logged-in student owns the registration
  if (registration.studentId !== Number(studentId)) {
    const error = new Error("Unauthorized. You do not own this registration");
    error.statusCode = 403;
    throw error;
  }

  // 3. Verify that a certificate has not already been issued
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

  // 4. Allow the certificate request & 5. Keep the request status as PENDING
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

/**
 * Admin: Get all certificate requests.
 */
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

/**
 * Admin: Get a single certificate request.
 */
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

/**
 * Helper to generate certificate number for program registrations.
 */
const generateProgramCertificateNumber = async (programId, type) => {
  const year = new Date().getFullYear();
  const count = await prisma.certificate.count();
  return `QNAYDS-${year}-${type || "PRG"}-${String(Number(programId)).padStart(
    3,
    "0",
  )}-${String(count + 1).padStart(5, "0")}`;
};

/**
 * Admin: Approve certificate request.
 * Changes status to APPROVED and generates certificate record.
 */
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

  // Ensure studentId is connected
  let studentId = registration.studentId;
  if (!studentId) {
    const user = await prisma.user.findUnique({
      where: { email: registration.email },
    });
    if (user) {
      studentId = user.id;
    }
  }

  // Update status to APPROVED
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

  // Create certificate record if not already created
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

/**
 * Admin: Reject certificate request.
 * Changes status to REJECTED.
 */
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
  matchRegistrationsByEmail,
  getMyProgramRegistrations,
  requestCertificate,
  getAllCertificateRequests,
  getCertificateRequestById,
  approveCertificateRequest,
  rejectCertificateRequest,
};

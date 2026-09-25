const crypto = require("crypto");
const prisma = require("../lib/prisma");

/**
 * Map program/certificate type to prefix code.
 * WEBINAR -> WEB
 * INTERNSHIP -> INT
 * WORKSHOP -> WORK
 */
const getProgramTypePrefix = (type) => {
  switch (type) {
    case "WEBINAR":
      return "WEB";
    case "INTERNSHIP":
      return "INT";
    case "WORKSHOP":
      return "WORK";
    case "COURSE":
      return "CRS";
    default:
      return type ? type.toUpperCase() : "PRG";
  }
};

/**
 * Generate a unique certificate number.
 * Examples:
 * QNAYDS-WEB-2026-000001
 * QNAYDS-INT-2026-000002
 * QNAYDS-WORK-2026-000003
 */
const generateProgramCertificateNumber = async (type) => {
  const year = new Date().getFullYear();
  const typeCode = getProgramTypePrefix(type);
  const prefix = `QNAYDS-${typeCode}-${year}-`;

  // Find all existing certificates to determine the next sequential counter
  const allCertificates = await prisma.certificate.findMany({
    select: { certificateNumber: true },
  });

  let maxSeq = 0;
  for (const cert of allCertificates) {
    if (cert.certificateNumber) {
      const parts = cert.certificateNumber.split("-");
      const lastPart = parts[parts.length - 1];
      const seqNum = parseInt(lastPart, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let certificateNumber = `${prefix}${String(nextSeq).padStart(6, "0")}`;

  // Ensure uniqueness in database
  while (await prisma.certificate.findUnique({ where: { certificateNumber } })) {
    nextSeq++;
    certificateNumber = `${prefix}${String(nextSeq).padStart(6, "0")}`;
  }

  return certificateNumber;
};

/**
 * Generate a unique secure verification code.
 * - Cryptographically secure
 * - Does not expose database ID
 * - Difficult to guess
 */
const generateVerificationCode = async () => {
  let isUnique = false;
  let verificationCode = "";

  while (!isUnique) {
    verificationCode = crypto.randomBytes(16).toString("hex");
    const existing = await prisma.certificate.findUnique({
      where: { verificationCode },
    });
    if (!existing) {
      isUnique = true;
    }
  }

  return verificationCode;
};

/**
 * Create a certificate for an approved program registration.
 * Flow:
 * ProgramRegistration -> APPROVED -> Create Certificate
 * Required Certificate Data:
 * - certificateNumber
 * - verificationCode
 * - type
 * - studentId
 * - programRegistrationId
 * - issuedAt
 * For external program certificates:
 * courseId = null and enrollmentId = null.
 *
 * Prevents duplicate certificate creation.
 */
const createProgramCertificate = async (programRegistrationId) => {
  const regId = Number(programRegistrationId);
  if (isNaN(regId)) {
    const error = new Error("Invalid registration ID");
    error.statusCode = 400;
    throw error;
  }

  // Check if certificate already exists
  const existingCertificate = await prisma.certificate.findUnique({
    where: { programRegistrationId: regId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      programRegistration: {
        include: {
          program: true,
        },
      },
    },
  });

  if (existingCertificate) {
    return existingCertificate;
  }

  // Fetch registration with program and student
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

  if (registration.certificate) {
    return registration.certificate;
  }

  // Resolve studentId:
  // Must be linked to a User account
  let studentId = registration.studentId;
  if (!studentId) {
    let user = await prisma.user.findUnique({
      where: { email: registration.email },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: registration.name,
          email: registration.email,
          phone: registration.phone || null,
          role: "STUDENT",
          isActive: true,
        },
      });
    }
    studentId = user.id;

    await prisma.programRegistration.update({
      where: { id: regId },
      data: { studentId },
    });
  }

  // Generate certificate credentials
  const certificateNumber = await generateProgramCertificateNumber(
    registration.program.type,
  );
  const verificationCode = await generateVerificationCode();

  // Create certificate with courseId = null and enrollmentId = null
  const certificate = await prisma.certificate.create({
    data: {
      certificateNumber,
      verificationCode,
      type: registration.program.type,
      studentId: Number(studentId),
      programRegistrationId: regId,
      courseId: null,
      enrollmentId: null,
      issuedAt: new Date(),
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
      programRegistration: {
        include: {
          program: true,
        },
      },
    },
  });

  return certificate;
};

/**
 * Administrator approves certificate request.
 * ProgramRegistration -> APPROVED -> Create Certificate (only if not already existing)
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

  // Update status to APPROVED
  const updatedRegistration = await prisma.programRegistration.update({
    where: { id: regId },
    data: {
      certificateRequestStatus: "APPROVED",
    },
    include: {
      student: true,
      program: true,
      certificate: true,
    },
  });

  // Create Certificate only if one does not already exist
  let certificate = updatedRegistration.certificate;
  if (!certificate) {
    certificate = await createProgramCertificate(regId);
  }

  return {
    registration: updatedRegistration,
    certificate,
  };
};

/**
 * Administrator rejects certificate request.
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

  return {
    registration: updatedRegistration,
  };
};

/**
 * GET /api/certificates/my
 * Students can only access their own certificates.
 */
const getMyCertificates = async (studentId) => {
  const studentNum = Number(studentId);
  if (isNaN(studentNum)) {
    const error = new Error("Invalid student ID");
    error.statusCode = 400;
    throw error;
  }

  return await prisma.certificate.findMany({
    where: {
      studentId: studentNum,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
        },
      },
      programRegistration: {
        include: {
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
        },
      },
    },
    orderBy: {
      issuedAt: "desc",
    },
  });
};

/**
 * GET /api/certificates/:id
 * Students can only access their own certificates.
 * Admins can access any certificate.
 */
const getCertificateById = async (certificateId, requestingUser) => {
  const certId = Number(certificateId);
  if (isNaN(certId)) {
    const error = new Error("Invalid certificate ID");
    error.statusCode = 400;
    throw error;
  }

  const certificate = await prisma.certificate.findUnique({
    where: {
      id: certId,
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
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
        },
      },
      programRegistration: {
        include: {
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
        },
      },
    },
  });

  if (!certificate) {
    const error = new Error("Certificate not found");
    error.statusCode = 404;
    throw error;
  }

  // Security check: Students can only access their own certificates
  if (
    requestingUser &&
    requestingUser.role !== "ADMIN" &&
    certificate.studentId !== Number(requestingUser.id)
  ) {
    const error = new Error(
      "Forbidden. You can only access your own certificates.",
    );
    error.statusCode = 403;
    throw error;
  }

  return certificate;
};

/**
 * GET /api/admin/certificates
 * Admin endpoints require admin authorization.
 */
const getAllCertificatesAdmin = async (filterOptions = {}) => {
  const { type, studentId, search } = filterOptions;

  const where = {};

  if (type) {
    where.type = type;
  }

  if (studentId) {
    where.studentId = Number(studentId);
  }

  if (search) {
    where.OR = [
      { certificateNumber: { contains: search, mode: "insensitive" } },
      { student: { name: { contains: search, mode: "insensitive" } } },
      { student: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  return await prisma.certificate.findMany({
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
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
        },
      },
      programRegistration: {
        include: {
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
        },
      },
    },
    orderBy: {
      issuedAt: "desc",
    },
  });
};

/**
 * GET /api/admin/certificates/:id
 * Admin endpoints require admin authorization.
 */
const getCertificateByIdAdmin = async (certificateId) => {
  const certId = Number(certificateId);
  if (isNaN(certId)) {
    const error = new Error("Invalid certificate ID");
    error.statusCode = 400;
    throw error;
  }

  const certificate = await prisma.certificate.findUnique({
    where: {
      id: certId,
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
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
        },
      },
      programRegistration: {
        include: {
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
        },
      },
    },
  });

  if (!certificate) {
    const error = new Error("Certificate not found");
    error.statusCode = 404;
    throw error;
  }

  return certificate;
};

/**
 * Fetch certificate with all details needed for PDF download.
 * Validates ID format, checks existence, and enforces authorization:
 * - Admin can download any certificate.
 * - Student can only download their own certificate.
 */
const getCertificateForDownload = async (certificateId, requestingUser) => {
  const certId = Number(certificateId);
  if (isNaN(certId) || certId <= 0) {
    const error = new Error("Invalid certificate ID");
    error.statusCode = 400;
    throw error;
  }

  const certificateInclude = {
    student: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    },
    course: {
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        instructor: {
          select: {
            name: true,
          },
        },
      },
    },
    enrollment: {
      select: {
        id: true,
        status: true,
        enrolledAt: true,
      },
    },
    programRegistration: {
      include: {
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
      },
    },
  };

  // Primary lookup: By Certificate ID
  let certificate = await prisma.certificate.findUnique({
    where: {
      id: certId,
    },
    include: certificateInclude,
  });

  // Secondary lookup: If not found by Certificate ID, check if ID was provided as ProgramRegistration ID
  if (!certificate) {
    certificate = await prisma.certificate.findUnique({
      where: {
        programRegistrationId: certId,
      },
      include: certificateInclude,
    });
  }

  // Tertiary lookup: If not found, check if ID was provided as Enrollment ID (Course)
  if (!certificate) {
    certificate = await prisma.certificate.findUnique({
      where: {
        enrollmentId: certId,
      },
      include: certificateInclude,
    });
  }

  if (!certificate) {
    const error = new Error("Certificate not found");
    error.statusCode = 404;
    throw error;
  }

  if (!requestingUser) {
    const error = new Error("Unauthorized. Please log in.");
    error.statusCode = 401;
    throw error;
  }

  // Authorization: Student can only download their own certificate; Admin can download any
  if (requestingUser.role !== "ADMIN") {
    const isOwner =
      certificate.studentId === Number(requestingUser.id) ||
      certificate.programRegistration?.studentId === Number(requestingUser.id) ||
      (certificate.programRegistration?.email &&
        requestingUser.email &&
        certificate.programRegistration.email.trim().toLowerCase() ===
          requestingUser.email.trim().toLowerCase());

    if (!isOwner) {
      const error = new Error(
        "Forbidden. You can only download your own certificate.",
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return certificate;
};

module.exports = {
  getProgramTypePrefix,
  generateProgramCertificateNumber,
  generateVerificationCode,
  createProgramCertificate,
  approveCertificateRequest,
  rejectCertificateRequest,
  getMyCertificates,
  getCertificateById,
  getAllCertificatesAdmin,
  getCertificateByIdAdmin,
  getCertificateForDownload,
};

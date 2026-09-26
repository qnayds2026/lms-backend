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
/**
 * Format an unissued or pending program registration into a certificate-compatible object
 */
const formatUnissuedProgramRegistration = (reg, studentUser, fallbackStudentId) => {
  const studentNum = reg.studentId || fallbackStudentId;
  return {
    id: `reg-${reg.id}`,
    certificateNumber: null,
    verificationCode: null,
    type: reg.program?.type || "PROGRAM",
    studentId: studentNum,
    courseId: null,
    enrollmentId: null,
    programRegistrationId: reg.id,
    issuedAt: null,
    createdAt: reg.createdAt,
    updatedAt: reg.updatedAt,
    student: reg.student || studentUser || {
      id: studentNum,
      name: reg.name,
      email: reg.email,
      phone: reg.phone,
    },
    course: null,
    programRegistration: {
      id: reg.id,
      name: reg.name,
      email: reg.email,
      phone: reg.phone,
      studentId: studentNum,
      programId: reg.programId,
      certificateRequestStatus: reg.certificateRequestStatus || "PENDING",
      createdAt: reg.createdAt,
      updatedAt: reg.updatedAt,
      program: reg.program,
    },
  };
};

/**
 * GET /api/certificates/my or /api/program-certificates/my
 * Students can only access their own certificates and pending program registrations.
 */
const getMyCertificates = async (studentId) => {
  const studentNum = Number(studentId);
  if (isNaN(studentNum)) {
    const error = new Error("Invalid student ID");
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch user to obtain email
  const studentUser = await prisma.user.findUnique({
    where: { id: studentNum },
    select: { id: true, name: true, email: true, phone: true },
  });

  // 2. Fetch issued certificates
  const issuedCertificates = await prisma.certificate.findMany({
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

  const issuedRegIds = new Set(
    issuedCertificates
      .map((c) => c.programRegistrationId)
      .filter((id) => id != null),
  );

  // 3. Fetch program registrations that don't have an issued certificate yet
  const orConditions = [{ studentId: studentNum }];
  if (studentUser?.email) {
    orConditions.push({ email: studentUser.email.trim() });
  }

  const unissuedRegistrations = await prisma.programRegistration.findMany({
    where: {
      OR: orConditions,
      certificate: null,
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
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 4. Format unissued registrations to match certificate structure
  const formattedUnissued = unissuedRegistrations
    .filter((reg) => !issuedRegIds.has(reg.id))
    .map((reg) => formatUnissuedProgramRegistration(reg, studentUser, studentNum));

  return [...issuedCertificates, ...formattedUnissued];
};

/**
 * GET /api/certificates/:id or /api/program-certificates/:id
 * Students can only access their own certificates; Admins can access any.
 */
const getCertificateById = async (certificateId, requestingUser) => {
  const certIdStr = String(certificateId);
  const studentNum = requestingUser ? Number(requestingUser.id) : null;
  const isAdmin = requestingUser && requestingUser.role === "ADMIN";

  let isRegPrefixed = false;
  let targetRegId = null;

  if (certIdStr.startsWith("reg-")) {
    isRegPrefixed = true;
    targetRegId = Number(certIdStr.replace("reg-", ""));
  }

  // 1. If not reg-prefixed, check in prisma.certificate
  if (!isRegPrefixed) {
    const numericCertId = Number(certificateId);
    if (!isNaN(numericCertId)) {
      const certificate = await prisma.certificate.findUnique({
        where: {
          id: numericCertId,
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

      if (certificate) {
        // Security check
        if (!isAdmin && requestingUser && certificate.studentId !== Number(requestingUser.id)) {
          const error = new Error("Forbidden. You can only access your own certificates.");
          error.statusCode = 403;
          throw error;
        }
        return certificate;
      }
    }
  }

  // 2. Fallback: Lookup in programRegistration
  const regIdToSearch = isRegPrefixed ? targetRegId : Number(certificateId);
  if (isNaN(regIdToSearch)) {
    const error = new Error("Invalid certificate ID");
    error.statusCode = 400;
    throw error;
  }

  const registration = await prisma.programRegistration.findUnique({
    where: {
      id: regIdToSearch,
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
    const error = new Error("Certificate not found");
    error.statusCode = 404;
    throw error;
  }

  // Security check for registration ownership
  if (!isAdmin && requestingUser) {
    const isOwner =
      registration.studentId === studentNum ||
      (requestingUser.email && registration.email === requestingUser.email.trim());
    if (!isOwner) {
      const error = new Error("Forbidden. You can only access your own certificates.");
      error.statusCode = 403;
      throw error;
    }
  }

  // If this registration already has an issued certificate, return full certificate with relations
  if (registration.certificate) {
    return {
      ...registration.certificate,
      student: registration.student || requestingUser,
      course: null,
      programRegistration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        studentId: registration.studentId || studentNum,
        programId: registration.programId,
        certificateRequestStatus: registration.certificateRequestStatus,
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
        program: registration.program,
      },
    };
  }

  return formatUnissuedProgramRegistration(registration, requestingUser, studentNum);
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
};

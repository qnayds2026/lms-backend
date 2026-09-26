const crypto = require("crypto");
const prisma = require("../lib/prisma");

const generateCertificateNumber = async (courseId) => {
  const year = new Date().getFullYear();

  const count = await prisma.certificate.count({
    where: {
      courseId: Number(courseId),
    },
  });

  return `QNAYDS-${year}-${String(Number(courseId)).padStart(
    3,
    "0",
  )}-${String(count + 1).padStart(5, "0")}`;
};

const createCertificate = async ({ studentId, courseId, enrollmentId }) => {
  // Prevent duplicate certificate
  const existingCertificate = await prisma.certificate.findUnique({
    where: {
      enrollmentId: Number(enrollmentId),
    },
  });

  if (existingCertificate) {
    return existingCertificate;
  }

  const certificateNumber = await generateCertificateNumber(courseId);

  const verificationCode = crypto.randomBytes(16).toString("hex");

  const certificate = await prisma.certificate.create({
    data: {
      certificateNumber,
      verificationCode,
      type: "COURSE",
      studentId: Number(studentId),
      courseId: Number(courseId),
      enrollmentId: Number(enrollmentId),
    },
  });

  return certificate;
};

const formatUnissuedRegistration = (reg, studentUser, fallbackStudentId) => {
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

const getMyCertificates = async (studentId) => {
  const studentNum = Number(studentId);
  if (isNaN(studentNum)) {
    throw new Error("Invalid student ID");
  }

  // 1. Fetch student user details (to match registrations by email if studentId wasn't linked)
  const studentUser = await prisma.user.findUnique({
    where: { id: studentNum },
    select: { id: true, name: true, email: true, phone: true },
  });

  // 2. Fetch existing issued certificates
  const issuedCertificates = await prisma.certificate.findMany({
    where: {
      studentId: studentNum,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
        },
      },
      programRegistration: {
        include: {
          program: {
            select: {
              id: true,
              title: true,
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
    .map((reg) => formatUnissuedRegistration(reg, studentUser, studentNum));

  return [...issuedCertificates, ...formattedUnissued];
};

const getCertificateById = async (studentId, certificateId) => {
  const studentNum = Number(studentId);
  const certIdStr = String(certificateId);

  let isRegPrefixed = false;
  let targetRegId = null;

  if (certIdStr.startsWith("reg-")) {
    isRegPrefixed = true;
    targetRegId = Number(certIdStr.replace("reg-", ""));
  }

  // 1. If not reg-prefixed, attempt to find in prisma.certificate
  if (!isRegPrefixed) {
    const certNumId = Number(certificateId);
    if (!isNaN(certNumId)) {
      const certificate = await prisma.certificate.findFirst({
        where: {
          id: certNumId,
          studentId: studentNum,
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
        return certificate;
      }
    }
  }

  // 2. Fallback: Lookup in programRegistration
  const regIdToSearch = isRegPrefixed ? targetRegId : Number(certificateId);
  if (isNaN(regIdToSearch)) {
    throw new Error("Certificate not found");
  }

  const studentUser = await prisma.user.findUnique({
    where: { id: studentNum },
    select: { id: true, name: true, email: true, phone: true },
  });

  const orConditions = [{ studentId: studentNum }];
  if (studentUser?.email) {
    orConditions.push({ email: studentUser.email.trim() });
  }

  const registration = await prisma.programRegistration.findFirst({
    where: {
      id: regIdToSearch,
      OR: orConditions,
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
    throw new Error("Certificate not found");
  }

  // If this registration already has an issued certificate, return full certificate with relations
  if (registration.certificate) {
    return {
      ...registration.certificate,
      student: registration.student || studentUser,
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

  return formatUnissuedRegistration(registration, studentUser, studentNum);
};

const verifyCertificate = async (verificationCode) => {
  const certificate = await prisma.certificate.findUnique({
    where: {
      verificationCode,
    },
    include: {
      student: {
        select: {
          name: true,
        },
      },
      course: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!certificate) {
    throw new Error("Invalid certificate");
  }

  return {
    valid: true,
    certificate: {
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.student.name,
      courseName: certificate.course.title,
      issuedAt: certificate.issuedAt,
    },
  };
};

module.exports = {
  createCertificate,
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
};

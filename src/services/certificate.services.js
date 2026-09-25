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
      studentId: Number(studentId),
      courseId: Number(courseId),
      enrollmentId: Number(enrollmentId),
    },
  });

  return certificate;
};

const getMyCertificates = async (studentId) => {
  return await prisma.certificate.findMany({
    where: {
      studentId: Number(studentId),
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
        },
      },
    },
    orderBy: {
      issuedAt: "desc",
    },
  });
};

const getCertificateById = async (studentId, certificateId) => {
  const certificate = await prisma.certificate.findFirst({
    where: {
      id: Number(certificateId),
      studentId: Number(studentId),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
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
    },
  });

  if (!certificate) {
    throw new Error("Certificate not found");
  }

  return certificate;
};

const verifyCertificate = async (verificationCode) => {
  if (!verificationCode || !verificationCode.trim()) {
    return { valid: false, message: "Certificate not found" };
  }

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
      programRegistration: {
        include: {
          program: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!certificate) {
    return { valid: false, message: "Certificate not found" };
  }

  const programName =
    certificate.course?.title ||
    certificate.programRegistration?.program?.title ||
    null;

  return {
    valid: true,
    data: {
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.student?.name || null,
      programName,
      type: certificate.type,
      issuedAt: certificate.issuedAt,
    },
  };
};

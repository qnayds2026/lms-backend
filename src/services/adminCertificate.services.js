const prisma = require("../lib/prisma");

const certificateSelect = {
  id: true,
  certificateNumber: true,
  verificationCode: true,
  type: true,
  issuedAt: true,
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
    },
  },
  programRegistration: {
    select: {
      id: true,
      program: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
    },
  },
};

const buildDateFilter = (date) => {
  if (!date) return undefined;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  if (isNaN(start.getTime())) return undefined;

  return { gte: start, lte: end };
};

const getAllCertificates = async (filters = {}) => {
  const {
    type,
    programId,
    courseId,
    studentId,
    certificateNumber,
    date,
    page = 1,
    limit = 20,
  } = filters;

  const where = {};

  if (type) where.type = type;
  if (courseId) where.courseId = Number(courseId);
  if (studentId) where.studentId = Number(studentId);

  if (certificateNumber) {
    where.certificateNumber = {
      contains: certificateNumber,
      mode: "insensitive",
    };
  }

  if (programId) {
    where.programRegistration = { programId: Number(programId) };
  }

  const dateFilter = buildDateFilter(date);
  if (dateFilter) where.issuedAt = dateFilter;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      select: certificateSelect,
      orderBy: { issuedAt: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.certificate.count({ where }),
  ]);

  return {
    certificates,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

const getCertificateById = async (id) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id: Number(id) },
    select: certificateSelect,
  });

  if (!certificate) {
    throw new Error("Certificate not found");
  }

  return certificate;
};

const searchCertificates = async (query) => {
  if (!query || !query.trim()) {
    return [];
  }

  const certificates = await prisma.certificate.findMany({
    where: {
      OR: [
        { certificateNumber: { contains: query, mode: "insensitive" } },
        { student: { name: { contains: query, mode: "insensitive" } } },
        { student: { email: { contains: query, mode: "insensitive" } } },
      ],
    },
    select: certificateSelect,
    orderBy: { issuedAt: "desc" },
  });

  return certificates;
};

module.exports = {
  getAllCertificates,
  getCertificateById,
  searchCertificates,
};
const prisma = require("../lib/prisma");

const createEnrollment = async (studentId, courseId) => {
  // Check student
  const student = await prisma.user.findUnique({
    where: {
      id: studentId,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Check course
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  // Check existing enrollment
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      courseId,
    },
  });

  if (existingEnrollment) {
    throw new Error("Student already enrolled in this course");
  }

  // Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      courseId,
      status: "PENDING",
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
          price: true,
        },
      },
    },
  });

  return enrollment;
};

const getMyCourses = async (studentId) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      status: "ACTIVE",
    },
    include: {
      course: true,
    },
  });

  return enrollments;
};

const updateEnrollmentStatus = async (enrollmentId, status) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      id: Number(enrollmentId),
    },
  });

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  const updatedEnrollment = await prisma.enrollment.update({
    where: {
      id: Number(enrollmentId),
    },
    data: {
      status,
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
        },
      },
    },
  });

  return updatedEnrollment;
};

const getAllEnrollments = async () => {
  return await prisma.enrollment.findMany({
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
          price: true,
        },
      },
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });
};

module.exports = {
  createEnrollment,
  getMyCourses,
  updateEnrollmentStatus,
  getAllEnrollments
};

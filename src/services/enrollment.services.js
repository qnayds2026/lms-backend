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

module.exports = {
  createEnrollment,
};

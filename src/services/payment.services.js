const prisma = require("../lib/prisma");

const createManualPayment = async (studentId, courseId, amount) => {
  // Check student
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Check course
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  // Check existing payment
  const existingPayment = await prisma.payment.findFirst({
    where: {
      studentId,
      courseId,
      status: {
        in: ["PENDING", "SUCCESS"],
      },
    },
  });

  if (existingPayment) {
    throw new Error("Payment already exists for this course");
  }

  const payment = await prisma.payment.create({
    data: {
      amount,
      paymentMethod: "MANUAL",
      status: "PENDING",
      studentId,
      courseId,
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

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      courseId,
    },
  });

  if (!existingEnrollment) {
    await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        status: "PENDING",
      },
    });
  }

  return payment;
};

const updatePaymentStatus = async (paymentId, status) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: Number(paymentId),
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  const updatedPayment = await prisma.payment.update({
    where: {
      id: Number(paymentId),
    },
    data: {
      status,
    },
  });

  // If payment approved, activate enrollment
  if (status === "SUCCESS") {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: payment.studentId,
        courseId: payment.courseId,
      },
    });

    if (enrollment) {
      await prisma.enrollment.update({
        where: {
          id: enrollment.id,
        },
        data: {
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.enrollment.create({
        data: {
          studentId: payment.studentId,
          courseId: payment.courseId,
          status: "ACTIVE",
        },
      });
    }
  }

  return updatedPayment;
};

const getMyPayments = async (studentId) => {
  return await prisma.payment.findMany({
    where: {
      studentId,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getAllPayments = async () => {
  return await prisma.payment.findMany({
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
      createdAt: "desc",
    },
  });
};

module.exports = {
  createManualPayment,
  updatePaymentStatus,
  getMyPayments,
  getAllPayments,
};

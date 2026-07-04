const prisma = require("../lib/prisma");

const getStudentDashboard = async (studentId) => {
  const enrolledCourses = await prisma.enrollment.count({
    where: {
      studentId,
      status: "ACTIVE",
    },
  });

  const unreadNotifications = await prisma.notification.count({
    where: {
      userId: studentId,
      isRead: false,
    },
  });

  const upcomingLiveClasses = await prisma.liveClass.count({
    where: {
      scheduledAt: {
        gte: new Date(),
      },
      course: {
        enrollments: {
          some: {
            studentId,
            status: "ACTIVE",
          },
        },
      },
    },
  });

  return {
    enrolledCourses,
    unreadNotifications,
    upcomingLiveClasses,
  };
};

const getAdminDashboard = async () => {
  const totalStudents = await prisma.user.count({
    where: {
      role: "STUDENT",
    },
  });

  const totalCourses = await prisma.course.count();

  const totalEnrollments = await prisma.enrollment.count({
    where: {
      status: "ACTIVE",
    },
  });

  const pendingPayments = await prisma.payment.count({
    where: {
      status: "PENDING",
    },
  });

  const revenue = await prisma.payment.aggregate({
    where: {
      status: "SUCCESS",
    },
    _sum: {
      amount: true,
    },
  });

  return {
    totalStudents,
    totalCourses,
    totalEnrollments,
    pendingPayments,
    totalRevenue: Number(revenue._sum.amount || 0),
  };
};

const getInstructorDashboard = async (instructorId) => {
  const myCourses = await prisma.course.count({
    where: {
      instructorId,
    },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: {
      course: {
        instructorId,
      },
      status: "ACTIVE",
    },
    select: {
      studentId: true,
    },
  });

  const uniqueStudents = new Set(enrollments.map((e) => e.studentId));

  const upcomingClasses = await prisma.liveClass.count({
    where: {
      instructorId,
      scheduledAt: {
        gte: new Date(),
      },
    },
  });

  return {
    myCourses,
    totalStudents: uniqueStudents.size,
    upcomingClasses,
  };
};

module.exports = {
  getStudentDashboard,
  getAdminDashboard,
  getInstructorDashboard,
};

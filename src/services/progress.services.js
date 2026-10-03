const prisma = require("../lib/prisma");
const { tryCompleteEnrollment } = require("./courseCompletion.services");

const completeRecording = async (studentId, recordingId) => {
  const recording = await prisma.recording.findUnique({
    where: {
      id: Number(recordingId),
    },
    include: {
      module: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!recording) {
    throw new Error("Recording not found");
  }

  console.log("Progress Debug:", {
    studentId: Number(studentId),
    recordingId: Number(recordingId),
    courseId: recording.module.courseId,
  });

  // Make sure the student is enrolled in this course
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: Number(studentId),
        courseId: recording.module.courseId,
      },
    },
  });

  console.log("Enrollment Found:", enrollment);

  if (!enrollment) {
    throw new Error("You are not enrolled in this course");
  }

  // Lifetime access: ACTIVE and COMPLETED students can both watch and
  // re-watch recordings, including ones added after they got their certificate.
  if (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED") {
    throw new Error("Your enrollment is not active");
  }

  // Create progress or update existing progress
  const progress = await prisma.studentProgress.upsert({
    where: {
      studentId_recordingId: {
        studentId: Number(studentId),
        recordingId: Number(recordingId),
      },
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
    create: {
      studentId: Number(studentId),
      recordingId: Number(recordingId),
      completed: true,
      completedAt: new Date(),
    },
  });

  // Recalculate current course progress
  const courseRecordings = await prisma.recording.findMany({
    where: {
      module: {
        courseId: recording.module.courseId,
      },
    },
    select: {
      id: true,
    },
  });

  const recordingIds = courseRecordings.map((item) => item.id);

  const completedCount = await prisma.studentProgress.count({
    where: {
      studentId: Number(studentId),
      recordingId: {
        in: recordingIds,
      },
      completed: true,
    },
  });

  const totalLessons = recordingIds.length;

  const courseCompleted = totalLessons > 0 && completedCount === totalLessons;

  // Reaching 100% alone is not enough. Only when the admin has also finalized
  // the course does the enrollment become COMPLETED and the certificate get
  // generated (in one transaction, never twice for the same enrollment).
  // If the course is not finalized yet, the enrollment stays ACTIVE and no
  // certificate is created; finalizing the course later issues it.
  let certificate = null;

  if (courseCompleted) {
    const result = await tryCompleteEnrollment({
      studentId: Number(studentId),
      courseId: recording.module.courseId,
      enrollmentId: enrollment.id,
    });
    certificate = result.certificate;
  }

  return {
    progress,
    courseCompleted,
    completedLessons: completedCount,
    totalLessons,
    certificate,
  };
};

const getCourseProgress = async (studentId, courseId) => {
  const course = await prisma.course.findUnique({
    where: {
      id: Number(courseId),
    },
    select: {
      id: true,
      title: true,
      modules: {
        select: {
          id: true,
          recordings: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  // Verify enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: Number(studentId),
        courseId: Number(courseId),
      },
    },
  });

  if (!enrollment) {
    throw new Error("You are not enrolled in this course");
  }

  if (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED") {
    throw new Error("Your enrollment is not active");
  }

  // Get all recording IDs belonging to the course
  const recordingIds = course.modules.flatMap((module) =>
    module.recordings.map((recording) => recording.id),
  );

  const totalLessons = recordingIds.length;

  // No lessons in course
  if (totalLessons === 0) {
    return {
      courseId: course.id,
      courseTitle: course.title,
      totalLessons: 0,
      completedLessons: 0,
      progressPercentage: 0,
      isCompleted: false,
    };
  }

  // Get completed recordings for this student
  const completedProgress = await prisma.studentProgress.findMany({
    where: {
      studentId: Number(studentId),
      recordingId: {
        in: recordingIds,
      },
      completed: true,
    },
    select: {
      recordingId: true,
      completedAt: true,
    },
  });

  const completedLessons = completedProgress.length;

  const progressPercentage = Math.round(
    (completedLessons / totalLessons) * 100,
  );

  const isCompleted = completedLessons === totalLessons;

  return {
    courseId: course.id,
    courseTitle: course.title,
    totalLessons,
    completedLessons,
    progressPercentage,
    isCompleted,
  };
};

module.exports = {
  completeRecording,
  getCourseProgress,
};
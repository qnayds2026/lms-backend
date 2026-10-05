const prisma = require("../lib/prisma");
const { createCertificate } = require("./certificate.services");
 
// Every recording of the course counts toward progress. This is the same
// definition used by completeRecording() and getCourseProgress().
const getCourseRecordingIds = async (db, courseId) => {
  const recordings = await db.recording.findMany({
    where: { module: { courseId: Number(courseId) } },
    select: { id: true },
  });
  return recordings.map((item) => item.id);
};
 
// Runs the work in a transaction. P2002 (unique constraint) means two requests
// tried to issue the same certificate at the same moment; retrying lets the
// second run find the certificate that already exists.
const runInTransaction = async (work) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await prisma.$transaction(work);
    } catch (err) {
      if (err.code === "P2002" && attempt < 3) continue;
      throw err;
    }
  }
};
 
/**
 * Completes the enrollment and issues the certificate, but ONLY when both
 * conditions are true:
 *   1. the admin has finalized the course (course.status === "COMPLETED")
 *   2. the student has really completed every current recording of the course
 *
 * It never creates or changes StudentProgress rows, so pending recordings stay
 * pending. Safe to call any number of times: the enrollment update and the
 * certificate happen in one transaction, and createCertificate() returns the
 * existing certificate instead of creating a second one.
 */
const tryCompleteEnrollment = async ({ studentId, courseId, enrollmentId }) =>
  runInTransaction(async (tx) => {
    const notReady = { completed: false, certificate: null };
 
    const course = await tx.course.findUnique({
      where: { id: Number(courseId) },
      select: { status: true },
    });
    if (!course || course.status !== "COMPLETED") return notReady;
 
    const enrollment = await tx.enrollment.findUnique({
      where: { id: Number(enrollmentId) },
      select: { id: true, status: true },
    });
    if (!enrollment || !["ACTIVE", "COMPLETED"].includes(enrollment.status)) {
      return notReady;
    }
 
    const recordingIds = await getCourseRecordingIds(tx, courseId);
    if (recordingIds.length === 0) return notReady;
 
    const completedCount = await tx.studentProgress.count({
      where: {
        studentId: Number(studentId),
        recordingId: { in: recordingIds },
        completed: true,
      },
    });
    if (completedCount < recordingIds.length) return notReady;
 
    if (enrollment.status !== "COMPLETED") {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "COMPLETED" },
      });
    }
 
    const certificate = await createCertificate(
      { studentId, courseId, enrollmentId: enrollment.id },
      tx,
    );
 
    return { completed: true, certificate };
  });
 
/**
 * Called when the admin finalizes a course. Goes through the enrolled students
 * and completes only those who are already at 100%. Students who are still
 * pending (for example 20/21) are left exactly as they are.
 */
const completeEligibleEnrollments = async (courseId) => {
  const id = Number(courseId);
 
  const recordingIds = await getCourseRecordingIds(prisma, id);
  if (recordingIds.length === 0) return { completedStudents: 0, failed: 0 };
 
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: id, status: { in: ["ACTIVE", "COMPLETED"] } },
    select: { id: true, studentId: true },
  });
  if (enrollments.length === 0) return { completedStudents: 0, failed: 0 };
 
  const grouped = await prisma.studentProgress.groupBy({
    by: ["studentId"],
    where: {
      studentId: { in: enrollments.map((item) => item.studentId) },
      recordingId: { in: recordingIds },
      completed: true,
    },
    _count: { recordingId: true },
  });
  const doneByStudent = new Map(
    grouped.map((row) => [row.studentId, row._count.recordingId]),
  );
 
  let completedStudents = 0;
  let failed = 0;
 
  for (const enrollment of enrollments) {
    if ((doneByStudent.get(enrollment.studentId) || 0) < recordingIds.length) {
      continue; // still has pending recordings: leave untouched
    }
 
    try {
      const result = await tryCompleteEnrollment({
        studentId: enrollment.studentId,
        courseId: id,
        enrollmentId: enrollment.id,
      });
      if (result.completed) completedStudents += 1;
    } catch (err) {
      // One failing student must not block the others. Saving the course as
      // COMPLETED again runs this check again.
      failed += 1;
      console.error(
        `Could not complete enrollment ${enrollment.id} for course ${id}:`,
        err.message,
      );
    }
  }
 
  return { completedStudents, failed };
};
 
module.exports = { tryCompleteEnrollment, completeEligibleEnrollments };
 

const PDFDocument = require("pdfkit");
const { renderProgramCertificate } = require("./programCertificatePdf");
const { renderCourseCertificate } = require("./courseCertificatePdf");

/**
 * Build certificate PDF and stream to output stream (such as Express response).
 *
 * Automatically detects whether the certificate is:
 * 1. External Program Certificate (Webinar / Internship / Workshop)
 *    Data Flow: Certificate -> ProgramRegistration -> Program
 * 2. Course Certificate
 *    Data Flow: Certificate -> Course -> Enrollment
 *
 * Keeps both workflows cleanly differentiated for future modifications.
 */
const buildCertificatePdf = (certificate, outputStream) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
        info: {
          Title: `QNAYDS Certificate - ${certificate.certificateNumber || "Certificate"}`,
          Author: "QNAYDS Academy",
          Subject: "Certificate of Completion",
          Keywords: "QNAYDS, Certificate, Education, Verification",
        },
      });

      doc.on("error", (err) => {
        reject(err);
      });

      if (outputStream) {
        outputStream.on("error", (err) => {
          reject(err);
        });
        outputStream.on("finish", () => {
          resolve();
        });
        doc.pipe(outputStream);
      }

      // Check if certificate belongs to an external program
      const isProgramCertificate =
        Boolean(certificate.programRegistration) ||
        Boolean(certificate.programRegistrationId) ||
        ["WEBINAR", "INTERNSHIP", "WORKSHOP"].includes(
          String(certificate.type).toUpperCase(),
        );

      if (isProgramCertificate) {
        // External Certificate Data Flow: Certificate -> ProgramRegistration -> Program
        const reg = certificate.programRegistration || {};
        const prog = reg.program || {};

        const data = {
          studentName: reg.name || certificate.student?.name || "Student",
          programTitle: prog.title || "External Program",
          programType: prog.type || certificate.type || "PROGRAM",
          startDate: prog.startDate,
          endDate: prog.endDate,
          issueDate: certificate.issuedAt,
          certificateNumber: certificate.certificateNumber,
          verificationCode: certificate.verificationCode,
        };

        renderProgramCertificate(doc, data);
      } else {
        // Course Certificate Data Flow: Certificate -> Course -> Enrollment
        const course = certificate.course || {};
        const enrollment = certificate.enrollment || {};

        const data = {
          studentName: certificate.student?.name || "Student",
          courseTitle: course.title || "Online Course",
          instructorName: course.instructor?.name || null,
          enrollmentDate: enrollment.enrolledAt,
          issueDate: certificate.issuedAt,
          certificateNumber: certificate.certificateNumber,
          verificationCode: certificate.verificationCode,
        };

        renderCourseCertificate(doc, data);
      }

      doc.end();

      // If outputStream was not provided or doesn't emit finish, resolve immediately on end
      if (!outputStream) {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  buildCertificatePdf,
  renderProgramCertificate,
  renderCourseCertificate,
};

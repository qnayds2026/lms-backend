const {
  PAGE_WIDTH,
  COLORS,
  formatDate,
  drawBorders,
  drawHeader,
  drawFooter,
} = require("./pdfTheme");

/**
 * Generate PDF layout specifically for LMS Course Certificates
 *
 * Data flow: Certificate -> Course -> Enrollment
 */
const renderCourseCertificate = (doc, data) => {
  const {
    studentName = "Student",
    courseTitle = "Online Course",
    instructorName,
    enrollmentDate,
    issueDate,
    certificateNumber,
    verificationCode,
  } = data;

  // 1. Decorative Borders & Corner Accents
  drawBorders(doc);

  // 2. QNAYDS Academy Header Branding
  drawHeader(doc);

  // 3. Certificate Title
  doc
    .fillColor(COLORS.NAVY)
    .fontSize(19)
    .font("Helvetica-Bold")
    .text("CERTIFICATE OF COURSE COMPLETION", 0, 130, {
      align: "center",
      characterSpacing: 2,
    });

  // Presentation Subtitle
  doc
    .fillColor(COLORS.TEXT_MUTED)
    .fontSize(9.5)
    .font("Helvetica")
    .text("THIS IS TO CERTIFY THAT", 0, 160, {
      align: "center",
      characterSpacing: 1.5,
    });

  // 4. Student Name
  const nameY = 186;
  doc
    .fillColor(COLORS.NAVY)
    .fontSize(28)
    .font("Helvetica-Bold")
    .text(studentName, 60, nameY, {
      width: PAGE_WIDTH - 120,
      align: "center",
    });

  // Gold underline under student name
  const underLineW = 280;
  const underLineX = (PAGE_WIDTH - underLineW) / 2;
  const underLineY = nameY + 36;
  doc
    .strokeColor(COLORS.GOLD)
    .lineWidth(1.2)
    .moveTo(underLineX, underLineY)
    .lineTo(underLineX + underLineW, underLineY)
    .stroke();

  // 5. Body / Achievement Description
  const bodyY = underLineY + 16;
  doc
    .fillColor(COLORS.TEXT_MAIN)
    .fontSize(11)
    .font("Helvetica")
    .text(
      "has successfully fulfilled all curriculum requirements, modules, and assessments for the course",
      60,
      bodyY,
      {
        width: PAGE_WIDTH - 120,
        align: "center",
      },
    );

  // 6. Course Title (Bold & Highlighted)
  const titleY = bodyY + 22;
  doc
    .fillColor(COLORS.NAVY)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(`"${courseTitle}"`, 60, titleY, {
      width: PAGE_WIDTH - 120,
      align: "center",
    });

  // 7. Instructor or Enrolled info & Commendation
  let nextY = titleY + 24;
  if (instructorName) {
    doc
      .fillColor(COLORS.DEEP_GOLD)
      .fontSize(9.5)
      .font("Helvetica-Bold")
      .text(`Instructor: ${instructorName}`, 60, nextY, {
        width: PAGE_WIDTH - 120,
        align: "center",
      });
    nextY += 18;
  } else if (enrollmentDate) {
    doc
      .fillColor(COLORS.DEEP_GOLD)
      .fontSize(9.5)
      .font("Helvetica-Bold")
      .text(`Enrolled on: ${formatDate(enrollmentDate)}`, 60, nextY, {
        width: PAGE_WIDTH - 120,
        align: "center",
      });
    nextY += 18;
  }

  // Commendation line
  doc
    .fillColor(COLORS.TEXT_MUTED)
    .fontSize(9)
    .font("Helvetica-Oblique")
    .text(
      "demonstrating dedication, mastery of course competencies, and adherence to professional standards.",
      80,
      nextY,
      {
        width: PAGE_WIDTH - 160,
        align: "center",
      },
    );

  // 8. Footer (Credential details, verification seal, signature, verify bar)
  drawFooter(doc, {
    certificateNumber,
    verificationCode,
    issueDate,
    type: "COURSE",
  });
};

module.exports = {
  renderCourseCertificate,
};

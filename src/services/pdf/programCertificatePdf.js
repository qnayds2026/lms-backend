const {
  PAGE_WIDTH,
  COLORS,
  formatDate,
  drawBorders,
  drawHeader,
  drawFooter,
} = require("./pdfTheme");

/**
 * Generate PDF layout specifically for External Program Certificates
 * (Webinar, Internship, Workshop)
 *
 * Data flow: Certificate -> ProgramRegistration -> Program
 */
const renderProgramCertificate = (doc, data) => {
  const {
    studentName = "Valued Participant",
    programTitle = "Professional Program",
    programType = "PROGRAM",
    startDate,
    endDate,
    issueDate,
    certificateNumber,
    verificationCode,
  } = data;

  const typeUpper = String(programType).toUpperCase();

  // 1. Decorative Borders & Corner Accents
  drawBorders(doc);

  // 2. QNAYDS Academy Header Branding
  drawHeader(doc);

  // 3. Certificate Title based on program type
  let certTitle = "CERTIFICATE OF COMPLETION";
  let commendation =
    "demonstrating exemplary dedication, practical skills, and commitment to excellence.";

  if (typeUpper === "INTERNSHIP") {
    certTitle = "CERTIFICATE OF INTERNSHIP";
    commendation =
      "demonstrating outstanding performance, technical competence, and valuable contributions throughout the internship period.";
  } else if (typeUpper === "WORKSHOP") {
    certTitle = "CERTIFICATE OF PARTICIPATION";
    commendation =
      "demonstrating proactive engagement, practical skill acquisition, and successful completion of all workshop sessions.";
  } else if (typeUpper === "WEBINAR") {
    certTitle = "CERTIFICATE OF PARTICIPATION";
    commendation =
      "demonstrating active participation, intellectual curiosity, and commitment to continuous learning.";
  }

  // Certificate Title Text
  doc
    .fillColor(COLORS.NAVY)
    .fontSize(19)
    .font("Helvetica-Bold")
    .text(certTitle, 0, 130, {
      align: "center",
      characterSpacing: 2,
    });

  // Presentation Subtitle
  doc
    .fillColor(COLORS.TEXT_MUTED)
    .fontSize(9.5)
    .font("Helvetica")
    .text("THIS IS PROUDLY PRESENTED TO", 0, 160, {
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
  const programDescriptor =
    typeUpper === "INTERNSHIP"
      ? "the comprehensive internship program in"
      : typeUpper === "WORKSHOP"
        ? "the intensive hands-on workshop on"
        : typeUpper === "WEBINAR"
          ? "the executive interactive webinar on"
          : "the certified program in";

  doc
    .fillColor(COLORS.TEXT_MAIN)
    .fontSize(11)
    .font("Helvetica")
    .text(
      `for successfully participating in and completing ${programDescriptor}`,
      60,
      bodyY,
      {
        width: PAGE_WIDTH - 120,
        align: "center",
      },
    );

  // 6. Program Title (Bold & Highlighted)
  const titleY = bodyY + 22;
  doc
    .fillColor(COLORS.NAVY)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(`"${programTitle}"`, 60, titleY, {
      width: PAGE_WIDTH - 120,
      align: "center",
    });

  // 7. Dates (if present) & Commendation
  let nextY = titleY + 24;
  if (startDate && endDate) {
    const dateText = `Conducted from ${formatDate(startDate)} to ${formatDate(endDate)}`;
    doc
      .fillColor(COLORS.DEEP_GOLD)
      .fontSize(9.5)
      .font("Helvetica-Bold")
      .text(dateText, 60, nextY, {
        width: PAGE_WIDTH - 120,
        align: "center",
      });
    nextY += 18;
  } else if (startDate) {
    const dateText = `Conducted on ${formatDate(startDate)}`;
    doc
      .fillColor(COLORS.DEEP_GOLD)
      .fontSize(9.5)
      .font("Helvetica-Bold")
      .text(dateText, 60, nextY, {
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
    .text(commendation, 80, nextY, {
      width: PAGE_WIDTH - 160,
      align: "center",
    });

  // 8. Footer (Credential details, verification seal, signature, verify bar)
  drawFooter(doc, {
    certificateNumber,
    verificationCode,
    issueDate,
    type: programType,
  });
};

module.exports = {
  renderProgramCertificate,
};

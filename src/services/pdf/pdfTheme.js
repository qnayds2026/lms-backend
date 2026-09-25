const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

const COLORS = {
  NAVY: "#0F172A",
  DARK_BLUE: "#1E293B",
  GOLD: "#C5A059",
  DEEP_GOLD: "#B45309",
  LIGHT_GOLD: "#F3E8CB",
  GOLD_BG: "#FEFCE8",
  TEXT_MAIN: "#1E293B",
  TEXT_MUTED: "#64748B",
  BORDER_DARK: "#0F172A",
  WHITE: "#FFFFFF",
};

/**
 * Format a Date object into "DD Month YYYY" (e.g. 25 September 2026)
 */
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Draw decorative double borders and corner ornaments
 */
const drawBorders = (doc) => {
  // Outer Navy Border
  doc
    .rect(20, 20, PAGE_WIDTH - 40, PAGE_HEIGHT - 40)
    .lineWidth(3.5)
    .stroke(COLORS.BORDER_DARK);

  // Inner Gold Border
  doc
    .rect(27, 27, PAGE_WIDTH - 54, PAGE_HEIGHT - 54)
    .lineWidth(1.5)
    .stroke(COLORS.GOLD);

  // Fine Inner Gold Line
  doc
    .rect(31, 31, PAGE_WIDTH - 62, PAGE_HEIGHT - 62)
    .lineWidth(0.5)
    .stroke(COLORS.LIGHT_GOLD);

  // Corner Ornaments (Diamonds at 4 corners)
  const corners = [
    { x: 38, y: 38 },
    { x: PAGE_WIDTH - 38, y: 38 },
    { x: 38, y: PAGE_HEIGHT - 38 },
    { x: PAGE_WIDTH - 38, y: PAGE_HEIGHT - 38 },
  ];

  corners.forEach((pt) => {
    doc.save();
    doc.translate(pt.x, pt.y);
    doc.rotate(45);
    doc.rect(-5, -5, 10, 10).fillAndStroke(COLORS.GOLD, COLORS.NAVY);
    doc.restore();
  });
};

/**
 * Draw QNAYDS Academy branding header
 */
const drawHeader = (doc) => {
  // Top Shield / Crest Icon
  const crestX = PAGE_WIDTH / 2;
  const crestY = 48;

  doc.save();
  // Draw small crest badge
  doc
    .circle(crestX, crestY, 14)
    .lineWidth(1)
    .fillAndStroke(COLORS.NAVY, COLORS.GOLD);

  doc
    .fillColor(COLORS.GOLD)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Q", crestX - 4.5, crestY - 6.5);
  doc.restore();

  // Branding: QNAYDS ACADEMY
  doc
    .fillColor(COLORS.NAVY)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("Q N A Y D S   A C A D E M Y", 0, 68, {
      align: "center",
      characterSpacing: 2.5,
    });

  // Tagline
  doc
    .fillColor(COLORS.DEEP_GOLD)
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .text(
      "EXCELLENCE IN LEARNING & PROFESSIONAL DEVELOPMENT",
      0,
      94,
      {
        align: "center",
        characterSpacing: 1.5,
      },
    );

  // Decorative divider line with center diamond
  const divY = 110;
  const lineStart = 220;
  const lineEnd = PAGE_WIDTH - 220;
  const midX = PAGE_WIDTH / 2;

  doc
    .strokeColor(COLORS.GOLD)
    .lineWidth(0.8)
    .moveTo(lineStart, divY)
    .lineTo(midX - 15, divY)
    .stroke();

  doc
    .strokeColor(COLORS.GOLD)
    .lineWidth(0.8)
    .moveTo(midX + 15, divY)
    .lineTo(lineEnd, divY)
    .stroke();

  doc.save();
  doc.translate(midX, divY);
  doc.rotate(45);
  doc.rect(-3.5, -3.5, 7, 7).fill(COLORS.GOLD);
  doc.restore();
};

/**
 * Draw the official verification seal badge
 */
const drawVerificationSeal = (doc, x, y) => {
  doc.save();
  doc.translate(x, y);

  // Outer ring
  doc.circle(0, 0, 32).lineWidth(1.5).stroke(COLORS.GOLD);

  // Inner ring
  doc.circle(0, 0, 27).lineWidth(0.7).stroke(COLORS.DEEP_GOLD);

  // Inner circle background
  doc.circle(0, 0, 25).fill(COLORS.GOLD_BG);

  // Star and Seal text
  doc
    .fillColor(COLORS.NAVY)
    .fontSize(6)
    .font("Helvetica-Bold")
    .text("QNAYDS", -16, -16, { width: 32, align: "center" });

  doc
    .fillColor(COLORS.DEEP_GOLD)
    .fontSize(7)
    .font("Helvetica-Bold")
    .text("VERIFIED", -22, -6, { width: 44, align: "center" });

  doc
    .fillColor(COLORS.NAVY)
    .fontSize(5)
    .font("Helvetica")
    .text("CREDENTIAL", -20, 4, { width: 40, align: "center" });

  doc
    .fillColor(COLORS.DEEP_GOLD)
    .fontSize(6)
    .font("Helvetica-Bold")
    .text("★ ★ ★", -14, 12, { width: 28, align: "center" });

  doc.restore();
};

/**
 * Draw footer containing credential metadata, verification seal, signatory, and verification bar
 */
const drawFooter = (
  doc,
  {
    certificateNumber,
    verificationCode,
    issueDate,
    type,
    verificationUrl = "https://lms.qnayds.in/certificates/verify",
  },
) => {
  const footerY = 448;

  // Left Column: Credential Info
  const leftX = 64;
  doc
    .fillColor(COLORS.DEEP_GOLD)
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .text("CREDENTIAL DETAILS", leftX, footerY - 14);

  doc
    .fillColor(COLORS.TEXT_MUTED)
    .fontSize(8)
    .font("Helvetica")
    .text("Issue Date: ", leftX, footerY + 2, { continued: true })
    .fillColor(COLORS.TEXT_MAIN)
    .font("Helvetica-Bold")
    .text(formatDate(issueDate));

  doc
    .fillColor(COLORS.TEXT_MUTED)
    .fontSize(8)
    .font("Helvetica")
    .text("Certificate Type: ", leftX, footerY + 16, { continued: true })
    .fillColor(COLORS.TEXT_MAIN)
    .font("Helvetica-Bold")
    .text(String(type || "Program").toUpperCase());

  doc
    .fillColor(COLORS.TEXT_MUTED)
    .fontSize(8)
    .font("Helvetica")
    .text("Certificate ID: ", leftX, footerY + 30, { continued: true })
    .fillColor(COLORS.NAVY)
    .font("Helvetica-Bold")
    .text(certificateNumber || "N/A");

  // Center Column: Official Verification Seal
  drawVerificationSeal(doc, PAGE_WIDTH / 2, footerY + 14);

  // Right Column: Signature
  const rightX = PAGE_WIDTH - 250;
  const sigLineY = footerY + 24;

  // Signature line
  doc
    .strokeColor(COLORS.NAVY)
    .lineWidth(1)
    .moveTo(rightX, sigLineY)
    .lineTo(rightX + 186, sigLineY)
    .stroke();

  doc
    .fillColor(COLORS.NAVY)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("Authorized Signatory", rightX, sigLineY + 6, {
      width: 186,
      align: "center",
    });

  doc
    .fillColor(COLORS.TEXT_MUTED)
    .fontSize(7.5)
    .font("Helvetica")
    .text("QNAYDS Academy Examination Board", rightX, sigLineY + 18, {
      width: 186,
      align: "center",
    });

  // Bottom Verification Bar
  const barY = 530;
  const barW = PAGE_WIDTH - 120;
  const barH = 22;

  doc
    .rect(60, barY, barW, barH)
    .lineWidth(0.5)
    .fillAndStroke("#F8FAFC", COLORS.LIGHT_GOLD);

  doc
    .fillColor(COLORS.TEXT_MUTED)
    .fontSize(7.5)
    .font("Helvetica")
    .text(
      `Verify authenticity online at: ${verificationUrl}  |  Verification Code: `,
      60,
      barY + 6,
      {
        width: barW,
        align: "center",
        continued: true,
      },
    )
    .fillColor(COLORS.NAVY)
    .font("Helvetica-Bold")
    .text(verificationCode || "N/A");
};

module.exports = {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  COLORS,
  formatDate,
  drawBorders,
  drawHeader,
  drawVerificationSeal,
  drawFooter,
};

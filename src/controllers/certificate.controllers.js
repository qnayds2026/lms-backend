const certificateService = require("../services/certificate.services")

const getMyCertificates = async (req, res) => {
  try {
    const studentId = req.user.id;

    const certificates = await certificateService.getMyCertificates(studentId);

    return res.status(200).json({
      success: true,
      message: "Certificates fetched successfully.",
      data: certificates,
    });
  } catch (error) {
    console.error("Get my certificates error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch certificates.",
    });
  }
};

const getCertificateById = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    const certificate = await certificateService.getCertificateById(
      studentId,
      id,
    );

    return res.status(200).json({
      success: true,
      message: "Certificate fetched successfully.",
      data: certificate,
    });
  } catch (error) {
    console.error("Get certificate error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Certificate not found.",
    });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const result = await certificateService.verifyCertificate(verificationCode);

    return res.status(200).json({
      success: true,
      message: "Certificate verified successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Verify certificate error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Invalid certificate.",
    });
  }
};

module.exports = {
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
};

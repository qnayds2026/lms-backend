const programCertificateService = require("../services/ProgramCertificate.Service");

/**
 * GET /api/certificates/my or /api/program-certificates/my
 * Logged-in student fetches their own certificates.
 */
const getMyCertificates = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Student not authenticated.",
      });
    }

    const certificates =
      await programCertificateService.getMyCertificates(studentId);

    return res.status(200).json({
      success: true,
      message: "Certificates fetched successfully.",
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    console.error("Get my certificates error:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to fetch certificates.",
    });
  }
};

/**
 * GET /api/certificates/:id or /api/program-certificates/:id
 * Fetch certificate by ID.
 * Student can only access their own certificate; Admin can access any.
 */
const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    const certificate = await programCertificateService.getCertificateById(
      id,
      requestingUser,
    );

    return res.status(200).json({
      success: true,
      message: "Certificate fetched successfully.",
      data: certificate,
    });
  } catch (error) {
    console.error("Get certificate by id error:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to fetch certificate.",
    });
  }
};

/**
 * GET /api/admin/certificates
 * Admin endpoint: Fetch all certificates with optional filtering.
 */
const getAllCertificatesAdmin = async (req, res) => {
  try {
    const { type, studentId, search } = req.query;

    const certificates =
      await programCertificateService.getAllCertificatesAdmin({
        type,
        studentId,
        search,
      });

    return res.status(200).json({
      success: true,
      message: "Certificates fetched successfully.",
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    console.error("Get all certificates admin error:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to fetch certificates.",
    });
  }
};

/**
 * GET /api/admin/certificates/:id
 * Admin endpoint: Fetch single certificate by ID.
 */
const getCertificateByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate =
      await programCertificateService.getCertificateByIdAdmin(id);

    return res.status(200).json({
      success: true,
      message: "Certificate fetched successfully.",
      data: certificate,
    });
  } catch (error) {
    console.error("Get admin certificate by id error:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to fetch certificate.",
    });
  }
};

/**
 * Admin: Approve certificate request and create certificate if one does not already exist.
 * ProgramRegistration -> APPROVED -> Create Certificate
 */
const approveCertificateRequestController = async (req, res) => {
  try {
    const { id } = req.params;

    const result =
      await programCertificateService.approveCertificateRequest(id);

    return res.status(200).json({
      success: true,
      message: "Certificate request approved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Approve certificate request error:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to approve certificate request.",
    });
  }
};

/**
 * Admin: Reject certificate request.
 * ProgramRegistration -> REJECTED
 */
const rejectCertificateRequestController = async (req, res) => {
  try {
    const { id } = req.params;

    const result =
      await programCertificateService.rejectCertificateRequest(id);

    return res.status(200).json({
      success: true,
      message: "Certificate request rejected successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Reject certificate request error:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to reject certificate request.",
    });
  }
};

module.exports = {
  getMyCertificates,
  getCertificateById,
  getAllCertificatesAdmin,
  getCertificateByIdAdmin,
  approveCertificateRequestController,
  rejectCertificateRequestController,
};

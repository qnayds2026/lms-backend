const {
  registerForProgram,
  getRegistrationsByProgram,
  getRegistrationById,
  searchRegistrationByEmail,
  getRegistrationStatus,
  getMyProgramRegistrations,
  requestCertificate,
  getAllCertificateRequests,
  getCertificateRequestById,
  approveCertificateRequest,
  rejectCertificateRequest,
} = require("../services/programRegistration.services");

// ==========================================
// Registration (Task 2)
// ==========================================

const register = async (req, res) => {
  try {
    const registration = await registerForProgram(
      req.params.programId,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: registration,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// ==========================================
// Admin — View registrations (Task 3)
// ==========================================

const getByProgram = async (req, res) => {
  try {
    const registrations = await getRegistrationsByProgram(
      req.params.programId,
    );

    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getOne = async (req, res) => {
  try {
    const registration = await getRegistrationById(req.params.id);

    res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const search = async (req, res) => {
  try {
    const registrations = await searchRegistrationByEmail(req.query.email);

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getStatus = async (req, res) => {
  try {
    const status = await getRegistrationStatus(req.params.id);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Dilshad: Student <-> Certificate flow
// ==========================================

const getMyProgramsController = async (req, res) => {
  try {
    const studentId = req.user.id;
    const registrations = await getMyProgramRegistrations(studentId);

    return res.status(200).json({
      success: true,
      message: "External programs fetched successfully.",
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error("Get my external programs error:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to fetch external programs.",
    });
  }
};

const requestCertificateController = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Student not authenticated.",
      });
    }

    const { id } = req.params;
    const registration = await requestCertificate(studentId, id);

    return res.status(200).json({
      success: true,
      message: "Certificate request submitted successfully.",
      data: registration,
    });
  } catch (error) {
    console.error("Certificate request error:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to submit certificate request.",
    });
  }
};

const getAllCertificateRequestsController = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await getAllCertificateRequests(status);

    return res.status(200).json({
      success: true,
      message: "Certificate requests fetched successfully.",
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get certificate requests error:", error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to fetch certificate requests.",
    });
  }
};

const getCertificateRequestByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await getCertificateRequestById(id);

    return res.status(200).json({
      success: true,
      message: "Certificate request fetched successfully.",
      data: request,
    });
  } catch (error) {
    console.error("Get single certificate request error:", error);
    return res.status(error.statusCode || 404).json({
      success: false,
      message: error.message || "Failed to fetch certificate request.",
    });
  }
};

const approveCertificateRequestController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await approveCertificateRequest(id);

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

const rejectCertificateRequestController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await rejectCertificateRequest(id);

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
  // Public & General
  register,
  getByProgram,
  getOne,
  search,
  getStatus,
  getMyProgramsController,
  requestCertificateController,
  getAllCertificateRequestsController,
  getCertificateRequestByIdController,
  approveCertificateRequestController,
  rejectCertificateRequestController,

  // Aliases for convenience / backward-compatibility
  getMyPrograms: getMyProgramsController,
  getMyProgramRegistrations: getMyProgramsController,
  requestCertificate: requestCertificateController,
  getAllCertificateRequests: getAllCertificateRequestsController,
  getCertificateRequestById: getCertificateRequestByIdController,
  approveCertificateRequest: approveCertificateRequestController,
  rejectCertificateRequest: rejectCertificateRequestController,
};

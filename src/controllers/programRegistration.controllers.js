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
// Public & General Program Registration Controllers
// ==========================================

// Register for a Program
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

// Get Registrations for a Program (Admin)
const getByProgram = async (req, res) => {
  try {
    const registrations = await getRegistrationsByProgram(
      req.params.programId,
    );

    return res.status(200).json({
      success: true,
      message: "Registrations fetched successfully",
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to fetch registrations",
    });
  }
};

// Get Single Registration (Admin)
const getOne = async (req, res) => {
  try {
    const registration = await getRegistrationById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Registration fetched successfully",
      data: registration,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to fetch registration",
    });
  }
};

// Search Registration by Email (Admin)
const search = async (req, res) => {
  try {
    const registrations = await searchRegistrationByEmail(req.query.email);

    return res.status(200).json({
      success: true,
      message: "Registrations fetched successfully",
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to search registrations",
    });
  }
};

// Get Registration Status (Admin)
const getStatus = async (req, res) => {
  try {
    const status = await getRegistrationStatus(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Registration status fetched successfully",
      data: status,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to fetch registration status",
    });
  }
};

// ==========================================
// Student & Certificate Controllers
// ==========================================

/**
 * Task 2: Get logged-in student's external programs
 * GET /api/program-registrations/my
 */
const getMyProgramsController = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Student not authenticated.",
      });
    }

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

/**
 * Task 3: Request certificate
 * POST /api/program-registrations/:id/certificate-request
 */
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

/**
 * Task 4: Admin get certificate requests
 * GET /api/program-registrations/certificate-requests
 * or GET /api/admin/certificate-requests
 */
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

/**
 * Task 4: Admin get single certificate request
 * GET /api/program-registrations/certificate-requests/:id
 * or GET /api/admin/certificate-requests/:id
 */
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

/**
 * Task 5: Admin approve certificate request
 * PATCH /api/program-registrations/:id/certificate-request/approve
 */
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

/**
 * Task 5: Admin reject certificate request
 * PATCH /api/program-registrations/:id/certificate-request/reject
 */
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

  // Student & Certificate (Controller Named)
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

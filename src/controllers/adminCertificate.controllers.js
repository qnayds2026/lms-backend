const adminCertificateService = require("../services/adminCertificate.services");

const getAllCertificates = async (req, res) => {
  try {
    const {
      type,
      programId,
      courseId,
      studentId,
      certificateNumber,
      date,
      page,
      limit,
    } = req.query;

    const result = await adminCertificateService.getAllCertificates({
      type,
      programId,
      courseId,
      studentId,
      certificateNumber,
      date,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Certificates fetched successfully.",
      count: result.certificates.length,
      pagination: result.pagination,
      data: result.certificates,
    });
  } catch (error) {
    console.error("Admin get all certificates error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch certificates.",
    });
  }
};

const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await adminCertificateService.getCertificateById(id);

    return res.status(200).json({
      success: true,
      message: "Certificate fetched successfully.",
      data: certificate,
    });
  } catch (error) {
    console.error("Admin get certificate by id error:", error);
    return res.status(404).json({
      success: false,
      message: error.message || "Certificate not found.",
    });
  }
};

const searchCertificates = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(200).json({
        success: true,
        message: "No search query provided.",
        count: 0,
        data: [],
      });
    }

    const certificates = await adminCertificateService.searchCertificates(
      query,
    );

    return res.status(200).json({
      success: true,
      message: "Search results fetched successfully.",
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    console.error("Admin search certificates error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to search certificates.",
    });
  }
};

module.exports = {
  getAllCertificates,
  getCertificateById,
  searchCertificates,
};
const {
  registerForProgram,
  getRegistrationsByProgram,
  getRegistrationById,
  searchRegistrationByEmail,
  getRegistrationStatus,
} = require("../services/programRegistration.services");

// Register for a Program
const register = async (req, res) => {
  try {
    const registration = await registerForProgram(
      req.params.programId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: registration,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Registrations for a Program (Admin)
const getByProgram = async (req, res) => {
  try {
    const registrations = await getRegistrationsByProgram(
      req.params.programId,
    );

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

// Get Single Registration (Admin)
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

// Search Registration by Email (Admin)
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

// Get Registration Status (Admin)
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

module.exports = {
  register,
  getByProgram,
  getOne,
  search,
  getStatus,
};
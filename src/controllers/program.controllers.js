const {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  activateProgram,
  deactivateProgram,
} = require("../services/program.services");

// Create Program
const create = async (req, res) => {
  try {
    const program = await createProgram(req.body);

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      data: program,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Programs
const getAll = async (req, res) => {
  try {
    const programs = await getAllPrograms();

    res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Program
const getOne = async (req, res) => {
  try {
    const program = await getProgramById(req.params.id);

    res.status(200).json({
      success: true,
      data: program,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Program
const update = async (req, res) => {
  try {
    const program = await updateProgram(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Program updated successfully",
      data: program,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Activate Program
const activate = async (req, res) => {
  try {
    const program = await activateProgram(req.params.id);

    res.status(200).json({
      success: true,
      message: "Program activated successfully",
      data: program,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Deactivate Program
const deactivate = async (req, res) => {
  try {
    const program = await deactivateProgram(req.params.id);

    res.status(200).json({
      success: true,
      message: "Program deactivated successfully",
      data: program,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  activate,
  deactivate,
};
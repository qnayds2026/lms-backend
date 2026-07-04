const {
  getStudentDashboard,
  getAdminDashboard,
  getInstructorDashboard,
} = require("../services/dashboard.services");

const studentDashboard = async (req, res) => {
  try {
    const data = await getStudentDashboard(req.user.id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const adminDashboard = async (req, res) => {
  try {
    const data = await getAdminDashboard();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const instructorDashboard = async (req, res) => {
  try {
    const data = await getInstructorDashboard(req.user.id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  studentDashboard,
  adminDashboard,
  instructorDashboard,
};

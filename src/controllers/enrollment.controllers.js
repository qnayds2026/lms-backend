const {
  createEnrollment,
  getMyCourses,
  updateEnrollmentStatus,
  getAllEnrollments,
} = require("../services/enrollment.services");

const create = async (req, res) => {
  try {
    const { courseId } = req.body;

    const enrollment = await createEnrollment(req.user.id, courseId);

    res.status(201).json({
      success: true,
      message: "Enrollment created successfully",
      data: enrollment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const myCourses = async (req, res) => {
  try {
    const courses = await getMyCourses(req.user.id);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const enrollment = await updateEnrollmentStatus(id, status);

    res.status(200).json({
      success: true,
      message: "Enrollment status updated successfully",
      data: enrollment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAll = async (req, res) => {
  try {
    const enrollments = await getAllEnrollments();

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
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
  myCourses,
  updateStatus,
  getAll,
};

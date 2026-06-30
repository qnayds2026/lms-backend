const { createEnrollment } = require("../services/enrollment.services");

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

module.exports = {
  create,
};

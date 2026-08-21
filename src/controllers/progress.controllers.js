const progressService = require("../services/progress.services");

const completeRecording = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { recordingId } = req.params;

    const progress = await progressService.completeRecording(
      studentId,
      recordingId,
    );

    return res.status(200).json({
      success: true,
      message: "Lesson marked as completed.",
      data: progress,
    });
  } catch (error) {
    console.error("Complete recording error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to mark lesson as completed.",
    });
  }
};

const getCourseProgress = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    const progress = await progressService.getCourseProgress(
      studentId,
      courseId,
    );

    return res.status(200).json({
      success: true,
      message: "Course progress fetched successfully.",
      data: progress,
    });
  } catch (error) {
    console.error("Get course progress error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch course progress.",
    });
  }
};

module.exports = {
  completeRecording,
  getCourseProgress,
};

const prisma = require("../lib/prisma.js");
const {
  extractYoutubeId,
  isValidVideoUrl,
  getEmbedUrl,
  getVideoProvider,
} = require("../utils/video.helper");

// POST /api/recordings  (instructor pastes a YouTube link for a module)
async function createRecording(req, res) {
  try {
    const { title, description, moduleId, position, videoUrl } = req.body;

    if (!title || !moduleId || !videoUrl) {
      return res.status(400).json({
        error: "title, moduleId and videoUrl are required",
      });
    }

    const parsedModuleId = parseInt(moduleId);

    if (isNaN(parsedModuleId)) {
      return res.status(400).json({
        error: "moduleId must be a valid number",
      });
    }

    if (!isValidVideoUrl(videoUrl)) {
      return res.status(400).json({
        error: "Only YouTube or Google Drive links are allowed.",
      });
    }

    const courseModule = await prisma.courseModule.findUnique({
      where: { id: parsedModuleId },
      include: { course: true },
    });

    if (!courseModule) {
      return res.status(404).json({
        error: "Module not found",
      });
    }

    if (
      courseModule.course.instructorId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        error: "Not authorized to add recordings to this module",
      });
    }

    const recording = await prisma.recording.create({
      data: {
        title,
        description,
        videoUrl: videoUrl.trim(),
        position: position ? parseInt(position) : 0,
        moduleId: parsedModuleId,
        isPublished: false,
      },
    });

    return res.status(201).json(recording);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to save recording",
    });
  }
}
// GET /api/recordings/module/:moduleId
// Enrollment-gated: only ACTIVE-enrolled students, or the owning instructor/admin, can view
async function getRecordingsByModule(req, res) {
  try {
    const { moduleId } = req.params;
    const parsedModuleId = parseInt(moduleId);
    if (isNaN(parsedModuleId)) {
      return res.status(400).json({ error: "moduleId must be a valid number" });
    }

    const courseModule = await prisma.courseModule.findUnique({
      where: { id: parsedModuleId },
      include: { course: true },
    });

    if (!courseModule) {
      return res.status(404).json({ error: "Module not found" });
    }

    const isOwnerOrAdmin =
      req.user.role === "ADMIN" ||
      courseModule.course.instructorId === req.user.id;

    if (!isOwnerOrAdmin) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: courseModule.courseId,
          },
        },
      });

      if (!enrollment || enrollment.status !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Course access required",
        });
      }
    }

    // Instructors/admins can see everything; students only see published recordings
    const publishFilter = isOwnerOrAdmin ? {} : { isPublished: true };

    const recordings = await prisma.recording.findMany({
      where: { moduleId: parsedModuleId, ...publishFilter },
      orderBy: { position: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        isPublished: true,
        videoUrl: true,
      },
    });

    const safeRecordings = recordings.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      duration: r.duration,
      isPublished: r.isPublished,

      provider: getVideoProvider(r.videoUrl),

      videoId: extractYoutubeId(r.videoUrl),

      embedUrl: getEmbedUrl(r.videoUrl),

      videoUrl: r.videoUrl,
    }));

    return res.json(safeRecordings);
  } catch (err) {
    console.error("Error fetching recordings:", err);
    return res.status(500).json({ error: "Failed to fetch recordings" });
  }
}

// PATCH /api/recordings/:id  (Instructor who owns the course, or Admin)
// Partial update: title, description, youtubeUrl, position can each be supplied independently.
async function updateRecording(req, res) {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "id must be a valid number" });
    }

    const { title, description, videoUrl, position } = req.body;

    const recording = await prisma.recording.findUnique({
      where: { id: parsedId },
      include: { module: { include: { course: true } } },
    });

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    if (
      recording.module.course.instructorId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to manage this recording" });
    }

    const data = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ error: "title cannot be empty" });
      }
      data.title = title;
    }

    if (description !== undefined) {
      data.description = description;
    }

    if (videoUrl !== undefined) {
      if (!isValidVideoUrl(videoUrl)) {
        return res.status(400).json({
          error: "Only YouTube or Google Drive links are allowed.",
        });
      }

      data.videoUrl = videoUrl.trim();
    }

    if (position !== undefined) {
      const parsedPosition = parseInt(position);
      if (isNaN(parsedPosition)) {
        return res
          .status(400)
          .json({ error: "position must be a valid number" });
      }
      data.position = parsedPosition;
    }

    const updated = await prisma.recording.update({
      where: { id: parsedId },
      data,
    });

    return res.json(updated);
  } catch (err) {
    console.error("Error updating recording:", err);
    return res.status(500).json({ error: "Failed to update recording" });
  }
}

// DELETE /api/recordings/:id  (Instructor who owns the course, or Admin)
async function deleteRecording(req, res) {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "id must be a valid number" });
    }

    const recording = await prisma.recording.findUnique({
      where: { id: parsedId },
      include: { module: { include: { course: true } } },
    });

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    if (
      recording.module.course.instructorId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to manage this recording" });
    }

    await prisma.recording.delete({ where: { id: parsedId } });

    return res.json({ success: true, id: parsedId });
  } catch (err) {
    console.error("Error deleting recording:", err);
    return res.status(500).json({ error: "Failed to delete recording" });
  }
}

// PATCH /api/recordings/:id/publish  (Instructor who owns the course, or Admin)
async function publishRecording(req, res) {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "id must be a valid number" });
    }

    const recording = await prisma.recording.findUnique({
      where: { id: parsedId },
      include: { module: { include: { course: true } } },
    });

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    if (
      recording.module.course.instructorId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to manage this recording" });
    }

    const updated = await prisma.recording.update({
      where: { id: parsedId },
      data: { isPublished: true },
    });

    return res.json(updated);
  } catch (err) {
    console.error("Error publishing recording:", err);
    return res.status(500).json({ error: "Failed to publish recording" });
  }
}

// PATCH /api/recordings/:id/unpublish  (Instructor who owns the course, or Admin)
async function unpublishRecording(req, res) {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "id must be a valid number" });
    }

    const recording = await prisma.recording.findUnique({
      where: { id: parsedId },
      include: { module: { include: { course: true } } },
    });

    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }

    if (
      recording.module.course.instructorId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to manage this recording" });
    }

    const updated = await prisma.recording.update({
      where: { id: parsedId },
      data: { isPublished: false },
    });

    return res.json(updated);
  } catch (err) {
    console.error("Error unpublishing recording:", err);
    return res.status(500).json({ error: "Failed to unpublish recording" });
  }
}

module.exports = {
  createRecording,
  getRecordingsByModule,
  updateRecording,
  deleteRecording,
  publishRecording,
  unpublishRecording,
};

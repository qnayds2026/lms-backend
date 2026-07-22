const prisma = require("../lib/prisma.js");
const { createZoomMeeting } = require("../lib/zoom.js");
const { createGoogleMeetEvent } = require("../lib/googlemeet.js");

// POST /api/liveclasses
async function createLiveClass(req, res) {
  try {
    const { title, description, courseId, scheduledAt, durationMinutes, platform, meetLink: manualLink } = req.body;
    const instructorId = req.user.id; // from auth middleware

    if (!title || !courseId || !scheduledAt || !platform) {
      return res.status(400).json({
        error: "title, courseId, scheduledAt, and platform are required",
      });
    }

    const validPlatforms = ["ZOOM", "GOOGLE_MEET", "MANUAL"];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: "platform must be ZOOM, GOOGLE_MEET, or MANUAL" });
    }

    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId)) {
      return res.status(400).json({ error: "courseId must be a valid number" });
    }

    const startTime = new Date(scheduledAt);
    if (isNaN(startTime.getTime())) {
      return res.status(400).json({ error: "scheduledAt must be a valid date" });
    }

    const duration = durationMinutes || 60;

    const course = await prisma.course.findUnique({ where: { id: parsedCourseId } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    let meetLink, meetingId;

    if (platform === "MANUAL") {
      if (!manualLink || !manualLink.trim()) {
        return res.status(400).json({ error: "meetLink is required when platform is MANUAL" });
      }
      meetLink = manualLink.trim();
      meetingId = null;
    } else if (platform === "ZOOM") {
      try {
        const result = await createZoomMeeting(title, startTime, duration);
        meetLink = result.meetLink;
        meetingId = result.meetingId;
      } catch (apiErr) {
        console.error("Zoom auto-create failed:", apiErr?.response?.data || apiErr);
        return res.status(502).json({
          error: "Failed to auto-create Zoom meeting. You can retry, or use platform: MANUAL with your own link instead.",
        });
      }
    } else {
      try {
        const result = await createGoogleMeetEvent(title, startTime, duration);
        meetLink = result.meetLink;
        meetingId = result.eventId;
      } catch (apiErr) {
        console.error("Google Meet auto-create failed:", apiErr?.response?.data || apiErr);
        return res.status(502).json({
          error: "Failed to auto-create Google Meet event. You can retry, or use platform: MANUAL with your own link instead.",
        });
      }
    }

    const liveClass = await prisma.liveClass.create({
      data: {
        title,
        description,
        platform,
        meetLink,
        meetingId,
        scheduledAt: startTime,
        courseId: parsedCourseId,
        instructorId,
      },
    });

    return res.status(201).json(liveClass);
  } catch (err) {
    console.error("Error creating live class:", err);
    return res.status(500).json({ error: "Failed to create live class" });
  }
}

// GET /api/liveclasses/course/:courseId
// Enrollment-gated: only ACTIVE-enrolled students, or the owning instructor/admin, can view
async function getLiveClassesByCourse(req, res) {
  try {
    const { courseId } = req.params;
    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId)) {
      return res.status(400).json({ error: "courseId must be a valid number" });
    }

    const course = await prisma.course.findUnique({ where: { id: parsedCourseId } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const isOwnerOrAdmin = req.user.role === "ADMIN" || course.instructorId === req.user.id;

    if (!isOwnerOrAdmin) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: parsedCourseId,
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

    const liveClasses = await prisma.liveClass.findMany({
      where: { courseId: parsedCourseId },
      orderBy: { scheduledAt: "asc" },
    });
    return res.json(liveClasses);
  } catch (err) {
    console.error("Error fetching live classes:", err);
    return res.status(500).json({ error: "Failed to fetch live classes" });
  }
}

// PUT /api/liveclasses/:id  (Instructor who owns the course, or Admin)
async function updateLiveClass(req, res) {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "id must be a valid number" });
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: parsedId },
      include: { course: true },
    });

    if (!liveClass) {
      return res.status(404).json({ error: "Live class not found" });
    }

    if (liveClass.course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Not authorized to manage this live class" });
    }

    const { title, description, scheduledAt, status, meetLink } = req.body;
    const data = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (meetLink !== undefined) data.meetLink = meetLink;

    if (scheduledAt !== undefined) {
      const parsedDate = new Date(scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "scheduledAt must be a valid date" });
      }
      data.scheduledAt = parsedDate;
    }

    if (status !== undefined) {
      const validStatuses = ["SCHEDULED", "LIVE", "ENDED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "status must be SCHEDULED, LIVE, or ENDED" });
      }
      data.status = status;
    }

    const updated = await prisma.liveClass.update({
      where: { id: parsedId },
      data,
    });

    return res.json(updated);
  } catch (err) {
    console.error("Error updating live class:", err);
    return res.status(500).json({ error: "Failed to update live class" });
  }
}

// DELETE /api/liveclasses/:id  (Instructor who owns the course, or Admin)
async function deleteLiveClass(req, res) {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "id must be a valid number" });
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: parsedId },
      include: { course: true },
    });

    if (!liveClass) {
      return res.status(404).json({ error: "Live class not found" });
    }

    if (liveClass.course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Not authorized to manage this live class" });
    }

    await prisma.liveClass.delete({ where: { id: parsedId } });
    return res.json({ message: "Live class deleted" });
  } catch (err) {
    console.error("Error deleting live class:", err);
    return res.status(500).json({ error: "Failed to delete live class" });
  }
}

module.exports = { createLiveClass, getLiveClassesByCourse, updateLiveClass, deleteLiveClass };
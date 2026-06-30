const prisma = require("../lib/prisma.js");
const { createZoomMeeting } = require("../lib/zoom.js");
const { createGoogleMeetEvent } = require("../lib/googleMeet.js");

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

    const startTime = new Date(scheduledAt);
    const duration = durationMinutes || 60;

    let meetLink, meetingId;

    if (platform === "MANUAL") {
      // Fallback: instructor pastes their own link, no API call made
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
      // GOOGLE_MEET
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
        courseId: parseInt(courseId),
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
async function getLiveClassesByCourse(req, res) {
  try {
    const { courseId } = req.params;
    const liveClasses = await prisma.liveClass.findMany({
      where: { courseId: parseInt(courseId) },
      orderBy: { scheduledAt: "asc" },
    });
    return res.json(liveClasses);
  } catch (err) {
    console.error("Error fetching live classes:", err);
    return res.status(500).json({ error: "Failed to fetch live classes" });
  }
}

module.exports = { createLiveClass, getLiveClassesByCourse };
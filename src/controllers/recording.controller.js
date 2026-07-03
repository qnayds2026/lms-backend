const prisma = require("../lib/prisma.js");

// Extracts the YouTube video ID from a full URL, embed URL, or short URL
function extractYoutubeId(url) {
  const match = url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// POST /api/recordings  (instructor pastes a YouTube link for a module)
async function createRecording(req, res) {
  try {
    const { title, description, moduleId, position, youtubeUrl } = req.body;

    if (!title || !moduleId || !youtubeUrl) {
      return res.status(400).json({ error: "title, moduleId, and youtubeUrl are required" });
    }

    const parsedModuleId = parseInt(moduleId);
    if (isNaN(parsedModuleId)) {
      return res.status(400).json({ error: "moduleId must be a valid number" });
    }

    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: "youtubeUrl is not a valid YouTube link" });
    }

    const courseModule = await prisma.courseModule.findUnique({
      where: { id: parsedModuleId },
      include: { course: true },
    });

    if (!courseModule) {
      return res.status(404).json({ error: "Module not found" });
    }

    if (courseModule.course.instructorId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Not authorized to add recordings to this module" });
    }

    const recording = await prisma.recording.create({
      data: {
        title,
        description,
        videoUrl: youtubeUrl.trim(),
        position: position ? parseInt(position) : 0,
        moduleId: parsedModuleId,
        isPublished: false,
      },
    });

    return res.status(201).json(recording);
  } catch (err) {
    console.error("Error creating recording:", err);
    return res.status(500).json({ error: "Failed to save recording" });
  }
}

// GET /api/recordings/module/:moduleId
async function getRecordingsByModule(req, res) {
  try {
    const { moduleId } = req.params;
    const parsedModuleId = parseInt(moduleId);
    if (isNaN(parsedModuleId)) {
      return res.status(400).json({ error: "moduleId must be a valid number" });
    }

    const recordings = await prisma.recording.findMany({
      where: { moduleId: parsedModuleId, isPublished: true },
      orderBy: { position: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        videoUrl: true,
      },
    });

    const safeRecordings = recordings.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      duration: r.duration,
      videoId: extractYoutubeId(r.videoUrl),
    }));

    return res.json(safeRecordings);
  } catch (err) {
    console.error("Error fetching recordings:", err);
    return res.status(500).json({ error: "Failed to fetch recordings" });
  }
}

module.exports = { createRecording, getRecordingsByModule };
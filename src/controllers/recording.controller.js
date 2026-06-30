const { uploadVideoToYouTube } = require("../services/youtube.service.js");
const prisma = require("../lib/prisma.js");

// Extracts the YouTube video ID from a full URL or embed URL
function extractYoutubeId(url) {
  const match = url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// POST /api/recordings  (instructor uploads a video file for a module)
async function createRecording(req, res) {
  try {
    const { title, description, moduleId, position } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }
    if (!title || !moduleId) {
      return res.status(400).json({ error: "title and moduleId are required" });
    }

    const { videoUrl } = await uploadVideoToYouTube(req.file.path, title, description);

    const recording = await prisma.recording.create({
      data: {
        title,
        description,
        videoUrl, // stored internally, never sent raw to students
        position: position ? parseInt(position) : 0,
        moduleId: parseInt(moduleId),
        isPublished: false,
      },
    });

    return res.status(201).json(recording);
  } catch (err) {
    console.error("Error creating recording:", err);
    return res.status(500).json({ error: "Failed to upload and save recording" });
  }
}

// GET /api/recordings/module/:moduleId
// Students hit this — response gives ONLY an embed-ready videoId, never the full URL/link
async function getRecordingsByModule(req, res) {
  try {
    const { moduleId } = req.params;

    const recordings = await prisma.recording.findMany({
      where: { moduleId: parseInt(moduleId), isPublished: true },
      orderBy: { position: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        videoUrl: true, // pulled internally only to derive videoId below
      },
    });

    // Strip the raw URL out of the response, replace with just the videoId
    const safeRecordings = recordings.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      duration: r.duration,
      videoId: extractYoutubeId(r.videoUrl), // e.g. "dQw4w9WgXcQ"
    }));

    return res.json(safeRecordings);
  } catch (err) {
    console.error("Error fetching recordings:", err);
    return res.status(500).json({ error: "Failed to fetch recordings" });
  }
}

module.exports = { createRecording, getRecordingsByModule };
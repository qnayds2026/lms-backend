const { google } = require("googleapis");
const fs = require("fs");

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});

const youtube = google.youtube({ version: "v3", auth: oauth2Client });

/**
 * Uploads a video file to YouTube as unlisted.
 * @param {string} filePath - local path to the uploaded video file (from multer)
 * @param {string} title
 * @param {string} description
 * @returns {Promise<{videoId: string, videoUrl: string}>}
 */
async function uploadVideoToYouTube(filePath, title, description) {
  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title,
        description: description || "",
      },
      status: {
        privacyStatus: "unlisted", // not searchable, only accessible via link
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });

  const videoId = res.data.id;
  const videoUrl = `https://www.youtube.com/embed/${videoId}`;

  // Clean up local temp file after upload
  fs.unlink(filePath, (err) => {
    if (err) console.error("Failed to delete temp file:", err);
  });

  return { videoId, videoUrl };
}

module.exports = { uploadVideoToYouTube };
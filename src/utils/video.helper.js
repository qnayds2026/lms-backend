function extractYoutubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

function extractGoogleDriveId(url) {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function isValidVideoUrl(url) {
  return !!(extractYoutubeId(url) || extractGoogleDriveId(url));
}

function getEmbedUrl(url) {
  const youtubeId = extractYoutubeId(url);

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  const driveId = extractGoogleDriveId(url);

  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  return null;
}

function getVideoProvider(url) {
  if (extractYoutubeId(url)) return "YOUTUBE";
  if (extractGoogleDriveId(url)) return "GOOGLE_DRIVE";
  return "UNKNOWN";
}

module.exports = {
  extractYoutubeId,
  extractGoogleDriveId,
  isValidVideoUrl,
  getEmbedUrl,
  getVideoProvider,
};

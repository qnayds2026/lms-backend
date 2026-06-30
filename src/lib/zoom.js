const axios = require("axios");

let cachedToken = null;
let tokenExpiry = 0;

// Server-to-Server OAuth: get an access token using account credentials
async function getZoomAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const basicAuth = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const res = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {},
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  cachedToken = res.data.access_token;
  // Token typically valid for 1 hour; refresh 5 min early
  tokenExpiry = Date.now() + (res.data.expires_in - 300) * 1000;

  return cachedToken;
}

/**
 * Creates a Zoom meeting.
 * @param {string} topic - meeting title
 * @param {Date} startTime - JS Date object
 * @param {number} durationMinutes
 * @returns {Promise<{meetLink: string, meetingId: string}>}
 */
async function createZoomMeeting(topic, startTime, durationMinutes = 60) {
  const accessToken = await getZoomAccessToken();

  const res = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      topic,
      type: 2, // scheduled meeting
      start_time: startTime.toISOString(),
      duration: durationMinutes,
      timezone: "UTC",
      settings: {
        join_before_host: false,
        waiting_room: true,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    meetLink: res.data.join_url,
    meetingId: res.data.id.toString(),
  };
}

module.exports = { createZoomMeeting };
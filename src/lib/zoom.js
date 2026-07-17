const axios = require("axios");

async function getZoomAccessToken() {
  const response = await axios.post(
    "https://zoom.us/oauth/token",
    null,
    {
      params: {
        grant_type: "account_credentials",
        account_id: process.env.ZOOM_ACCOUNT_ID,
      },
      auth: {
        username: process.env.ZOOM_CLIENT_ID,
        password: process.env.ZOOM_CLIENT_SECRET,
      },
    }
  );
  return response.data.access_token;
}

async function createZoomMeeting(title, startTime, durationMinutes) {
  const accessToken = await getZoomAccessToken();

  const response = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      topic: title,
      type: 2,
      start_time: startTime.toISOString(),
      duration: durationMinutes,
      timezone: "UTC",
      settings: {
        join_before_host: true,
        waiting_room: false,
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
    meetLink: response.data.join_url,
    meetingId: String(response.data.id),
  };
}

module.exports = { createZoomMeeting };
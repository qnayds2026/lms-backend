const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

/**
 * Creates a Google Calendar event with an auto-generated Meet link.
 * @param {string} title
 * @param {Date} startTime
 * @param {number} durationMinutes
 * @returns {Promise<{meetLink: string, eventId: string}>}
 */
async function createGoogleMeetEvent(title, startTime, durationMinutes = 60) {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  const res = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: title,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  if (!res.data.hangoutLink || !res.data.id) {
    throw new Error(
      "Google Calendar did not return a Meet link — conference creation may still be provisioning"
    );
  }

  return {
    meetLink: res.data.hangoutLink,
    eventId: res.data.id,
  };
}

module.exports = { createGoogleMeetEvent };
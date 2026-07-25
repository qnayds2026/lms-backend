// const express = require("express");
// const router = express.Router();
// const { google } = require("googleapis");

// const oauth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   process.env.GOOGLE_REDIRECT_URI
// );

// // Mounted at /api/auth/google in server.js, so this is:
// // GET /api/auth/google/auth
// router.get("/auth", (req, res) => {
//   const url = oauth2Client.generateAuthUrl({
//     access_type: "offline",
//     prompt: "consent",
//     scope: ["https://www.googleapis.com/auth/calendar"],
//   });
//   res.redirect(url);
// });

// // Mounted at /api/auth/google in server.js, so this is:
// // GET /api/auth/google/callback
// router.get("/callback", async (req, res) => {
//   try {
//     const { code } = req.query;
//     if (!code) {
//       return res.status(400).send("Missing authorization code in callback.");
//     }
//     const { tokens } = await oauth2Client.getToken(code);

//     if (!tokens.refresh_token) {
//       return res.send(`
//         <h2>No refresh token received</h2>
//         <p>This usually means you've already authorized this app before.
//         Go to <a href="https://myaccount.google.com/permissions" target="_blank">
//         Google Account permissions</a>, remove access for this app, then
//         visit <a href="/api/auth/google/auth">/api/auth/google/auth</a> again.</p>
//       `);
//     }

//     res.send(`
//       <h2>Success! Copy this into your .env file:</h2>
//       <pre style="background:#f4f4f4;padding:16px;border-radius:8px;word-break:break-all;">GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}</pre>
//       <p>After saving it, restart your backend server. This callback page is no longer needed for normal use.</p>
//     `);
//   } catch (err) {
//     console.error("Google OAuth callback failed:", err?.response?.data || err);
//     res.status(500).send("Failed to exchange authorization code. Check server logs.");
//   }
// });

// module.exports = router;
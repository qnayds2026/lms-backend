const axios = require("axios");

const sendResetPasswordEmail = async (to, resetUrl) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: process.env.SMTP_FROM,
          name: "QNAYDS",
        },

        to: [
          {
            email: to,
          },
        ],

        subject: "Reset your QNAYDS password",

        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;">
            
            <h2 style="color: #111827;">
              Reset your QNAYDS password
            </h2>

            <p>
              You requested a password reset for your QNAYDS account.
            </p>

            <p>
              Click the button below to reset your password:
            </p>

            <div style="margin: 30px 0;">
              <a
                href="${resetUrl}"
                style="
                  display: inline-block;
                  padding: 12px 24px;
                  background: #2563eb;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                "
              >
                Reset Password
              </a>
            </div>

            <p>
              This link will expire in <strong>1 hour</strong>.
            </p>

            <p>
              If you didn't request this password reset, you can safely ignore
              this email.
            </p>

            <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;" />

            <p style="font-size: 12px; color: #6b7280;">
              © QNAYDS. All rights reserved.
            </p>

          </div>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    console.log("✅ Password reset email sent:", to);
  } catch (error) {
    console.error("❌ Password reset email failed:", {
      email: to,
      error: error.response?.data || error.message,
    });

    throw new Error("Failed to send password reset email");
  }
};

module.exports = {
  sendResetPasswordEmail,
};

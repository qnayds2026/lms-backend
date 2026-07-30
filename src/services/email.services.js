const transporter = require("../config/mail");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendActivationEmail = async ({ name, email, token }) => {
  const activationLink = `${process.env.FRONTEND_URL}/activate-account?token=${token}`;

  const mailOptions = {
    from: `"QNAYDS Academy" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Activate your QNAYDS LMS Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
        <h2>🎉 Welcome to QNAYDS Academy</h2>

        <p>Hi <strong>${name}</strong>,</p>

        <p>Thank you for purchasing our course.</p>

        <p>Your payment has been verified successfully.</p>

        <p>Please activate your LMS account to start learning.</p>

        <p style="margin:30px 0;">
          <a
            href="${activationLink}"
            style="
              background:#2563eb;
              color:#fff;
              text-decoration:none;
              padding:12px 24px;
              border-radius:6px;
              display:inline-block;
            "
          >
            Activate Account
          </a>
        </p>

        <p>This activation link expires in <strong>24 hours</strong>.</p>

        <hr>

        <p>Regards,<br><strong>QNAYDS Academy</strong></p>
      </div>
    `,
  };

  const retryDelays = [0, 5000, 10000];

  let lastError;

  for (let i = 0; i < retryDelays.length; i++) {
    try {
      if (retryDelays[i] > 0) {
        console.log(`Retrying activation email (Attempt ${i + 1})...`);

        await sleep(retryDelays[i]);
      }

      const info = await transporter.sendMail(mailOptions);

      console.log(`✅ Activation email sent successfully (Attempt ${i + 1})`);

      return info;
    } catch (err) {
      lastError = err;

      console.error(
        `❌ Activation email attempt ${i + 1} failed:`,
        err.message,
      );
    }
  }

  throw lastError;
};

module.exports = {
  sendActivationEmail,
};

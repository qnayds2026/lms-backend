const { sendEmail } = require("./brevo.service");

const sendActivationEmail = async ({ name, email, token }) => {
  const activationLink = `${process.env.FRONTEND_URL}/activate-account?token=${token}`;

  await sendEmail({
    to: email,
    name,

    subject: "Activate your QNAYDS LMS Account",

    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
        <h2>🎉 Welcome to QNAYDS Academy</h2>

        <p>Hi <strong>${name}</strong>,</p>

        <p>Your payment has been verified successfully.</p>

        <p>Please activate your LMS account.</p>

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

        <p>This link expires in <strong>24 hours</strong>.</p>

        <hr>

        <p>Regards,<br><strong>QNAYDS Academy</strong></p>
      </div>
    `,
  });

  console.log("✅ Activation email sent via Brevo API");
};

module.exports = {
  sendActivationEmail,
};

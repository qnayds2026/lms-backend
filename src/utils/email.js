const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.GMAIL_SMTP_HOST,
  port: Number(process.env.GMAIL_SMTP_PORT),
  secure: process.env.GMAIL_SMTP_PORT === "465",
  auth: {
    user: process.env.GMAIL_SMTP_USER,
    pass: process.env.GMAIL_SMTP_PASS,
  },
});

const sendResetPasswordEmail = async (to, resetUrl) => {
  await transporter.sendMail({
    from: process.env.GMAIL_SMTP_USER,
    to,
    subject: "Reset your Qnayds password",
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });
};

module.exports = { sendResetPasswordEmail };

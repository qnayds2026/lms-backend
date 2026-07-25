const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendResetPasswordEmail = async (to, resetUrl) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_EMAIL,
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
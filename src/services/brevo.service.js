const axios = require("axios");

const brevo = axios.create({
  baseURL: "https://api.brevo.com/v3",
  headers: {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": process.env.BREVO_API_KEY,
  },
});

const sendEmail = async ({ to, name, subject, html }) => {
  const { data } = await brevo.post("/smtp/email", {
    sender: {
      name: "QNAYDS Academy",
      email: process.env.SMTP_FROM,
    },

    to: [
      {
        email: to,
        name,
      },
    ],

    subject,

    htmlContent: html,
  });

  return data;
};

module.exports = {
  sendEmail,
};

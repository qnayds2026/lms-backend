require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectRedis } = require("./src/config/redis.js");
const authRoutes = require("./src/routes/auth.routes.js");
const enrollmentRoutes = require("./src/routes/enrollment.routes.js");
const notificationRoutes = require("./src/routes/notification.routes.js");
const dashboardRoutes = require("./src/routes/dashboard.routes.js");

const courseRoutes = require("./src/routes/course.routes.js");
const liveclassRoutes = require("./src/routes/liveclass.routes.js");

const recordingRoutes = require("./src/routes/recording.routes.js");
const moduleRoutes = require("./src/routes/module.routes.js");
const moduleAttachmentRoutes = require("./src/routes/moduleAttachment.routes.js");
const noteRoutes = require("./src/routes/note.routes.js");

const adminRoutes = require("./src/routes/admin.routes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const googleAuthRoutes = require("./src/routes/googleAuth.routes.js");

const landingRoutes = require("./src/routes/landing.routes.js");
const reviewRoutes = require("./src/routes/review.routes.js");
const progressRoutes = require("./src/routes/progress.routes.js");
const certificateRoutes = require("./src/routes/certificate.routes.js");
const webinarRoutes = require("./src/routes/webinar.routes.js");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(helmet());
app.use(morgan("combined"));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3001",
  "https://lms.qnayds.in",
  "https://qnayds.in",
  "https://ai.qnayds.in",
  "https://www.qnayds.in",
  "https://jeh.qnayds.in",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  console.log("GET / reached");

  res.status(200).json({
    success: true,
    message: "Backend is working",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/liveclasses", liveclassRoutes);

app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/module-attachments", moduleAttachmentRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/landing", landingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/webinar", webinarRoutes);

const PORT = process.env.PORT || 3000;

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  res.status(500).json({
    message: err.message,
  });
});

const startServer = async () => {
  try {
    // Connect Redis BEFORE loading payment routes
    await connectRedis();

    // Load payment routes only after Redis is connected
    const paymentRoutes = require("./src/routes/payment.routes.js");

    app.use("/api/payments", paymentRoutes);

    app.listen(PORT, "0.0.0.0", () => {
      console.log("PORT ENV =", process.env.PORT);
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
};

startServer();

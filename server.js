require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./src/routes/auth.routes.js");

const courseRoutes = require("./src/routes/course.routes.js");
const liveclassRoutes = require("./src/routes/liveclass.routes.js");

const recordingRoutes = require("./src/routes/recording.routes.js");
const moduleRoutes = require("./src/routes/module.routes.js");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use(morgan("combined"));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/liveclasses", liveclassRoutes);

app.use("/api/recordings", recordingRoutes);
app.use("/api/modules", moduleRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



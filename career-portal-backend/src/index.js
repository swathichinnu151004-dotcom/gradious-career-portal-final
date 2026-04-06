const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const jobRoutes = require("./routes/jobRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded files if needed
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// serve frontend files from backend
app.use(express.static(path.join(__dirname, "../../career-portal-frontend")));

// api routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/user", userRoutes);
app.use("/api/notifications", notificationRoutes);

// optional root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../career-portal-frontend/index.html"));
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
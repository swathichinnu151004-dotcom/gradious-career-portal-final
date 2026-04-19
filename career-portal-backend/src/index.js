const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const logger = require("./utils/logger");
const { ensureNotificationsTable } = require("./utils/ensureNotificationsTable");

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

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/user", userRoutes);
app.use("/api/notifications", notificationRoutes);

const staticCandidates = [
  process.env.STATIC_PATH && String(process.env.STATIC_PATH).trim(),
  path.join(__dirname, "../../career-portal-react/build"),
  path.join(__dirname, "../../career-portal-frontend"),
].filter(Boolean);

const staticRoot = staticCandidates.find((dir) => fs.existsSync(dir));

if (staticRoot) {
  logger.info(`Serving static UI from ${staticRoot}`);
  app.use(express.static(staticRoot));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(staticRoot, "index.html"));
  });
} else {
  logger.warn(
    "No static UI directory found (set STATIC_PATH or run `npm run build` in career-portal-react). API-only mode."
  );
}

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await ensureNotificationsTable();
  } catch (e) {
    logger.error(
      "Failed to prepare notifications table (notifications may not work):",
      e
    );
  }

  app.listen(PORT, async () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    try {
      const sendMail = require("./utils/sendMail");
      if (typeof sendMail.verifySmtpConfig === "function") {
        await sendMail.verifySmtpConfig();
      }
    } catch (e) {
      logger.warn("[sendMail] Startup verify skipped:", e.message);
    }
  });
}

startServer();

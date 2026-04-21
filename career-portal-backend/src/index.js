const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const logger = require("./utils/logger");
const { ensureNotificationsTable } = require("./utils/ensureNotificationsTable");
const db = require("./config/connectDB");

const app = express();

/** Behind nginx, Railway, Render, etc. — set TRUST_PROXY=1 so req IP / secure cookies behave. */
if (String(process.env.TRUST_PROXY || "").trim() === "1") {
  app.set("trust proxy", 1);
}

function isLoopbackOrigin(url) {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `http://${url}`);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function corsAllowedOrigins() {
  const raw = String(process.env.CORS_ORIGINS || "").trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim().replace(/\/$/, ""))
      .filter(Boolean);
  }
  const front = String(process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
  if (!front || isLoopbackOrigin(front)) {
    return [];
  }
  return [front];
}

const origins = corsAllowedOrigins();
const corsMiddleware =
  origins.length > 0
    ? cors({
        origin: origins.length === 1 ? origins[0] : origins,
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    : cors();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const jobRoutes = require("./routes/jobRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use(corsMiddleware);
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
  // Express 5 / path-to-regexp v8+ rejects app.get("*", …). SPA fallback without a "*" route pattern.
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(staticRoot, "index.html"), (err) => {
      if (err) next(err);
    });
  });
} else {
  logger.warn(
    "No static UI directory found (set STATIC_PATH or run `npm run build` in career-portal-react). API-only mode."
  );
}

const PORT = Number(process.env.PORT) || 5000;
/** Listen on all interfaces so phones and other devices on the LAN can reach the API. */
const LISTEN_HOST = process.env.LISTEN_HOST || "0.0.0.0";

async function startServer() {
  try {
    await ensureNotificationsTable();
  } catch (e) {
    logger.error(
      "Failed to prepare notifications table (notifications may not work):",
      e
    );
  }

  // Warm the pool before accepting traffic so the first API call (e.g. profile)
  // does not pay TCP + auth + session setup latency on the critical path.
  try {
    await db.query("SELECT 1");
    logger.info("MySQL pool warmed (ready for requests)");
  } catch (e) {
    logger.error(
      "MySQL pool warmup failed — check DB_HOST / DB_PORT / credentials:",
      e.message || e
    );
  }

  app.listen(PORT, LISTEN_HOST, () => {
    const publicHint = String(process.env.FRONTEND_URL || "").trim();
    logger.info(
      `Server listening on port ${PORT} (bind ${LISTEN_HOST})${
        publicHint
          ? ` — public app URL for users: ${publicHint.replace(/\/$/, "")}`
          : " — set FRONTEND_URL in .env for email links and optional CORS"
      }`
    );
    // Defer SMTP verify so it never competes with early API/DB traffic on cold start.
    setImmediate(() => {
      (async () => {
        try {
          const sendMail = require("./utils/sendMail");
          if (typeof sendMail.verifySmtpConfig === "function") {
            await sendMail.verifySmtpConfig();
          }
        } catch (e) {
          logger.warn("[sendMail] Startup verify skipped:", e.message);
        }
      })();
    });
  });
}

startServer();

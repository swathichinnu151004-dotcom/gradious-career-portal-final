const mysql = require("mysql2/promise");
const logger = require("../utils/logger");
require("dotenv").config();

/**
 * Avoid `localhost` as the default MySQL host: Node often resolves it to IPv6
 * (`::1`) first; a server bound only to IPv4 can cause long TCP timeouts (~10–20s)
 * before a working connection is established (common on Windows dev machines).
 */
function resolveDbHost() {
  const raw = process.env.DB_HOST;
  if (raw == null || String(raw).trim() === "") return "127.0.0.1";
  const trimmed = String(raw).trim();
  return trimmed.toLowerCase() === "localhost" ? "127.0.0.1" : trimmed;
}

const resolvedHost = resolveDbHost();
const resolvedPort = Number.parseInt(process.env.DB_PORT || "3306", 10);
const dbPort = Number.isFinite(resolvedPort) && resolvedPort > 0 ? resolvedPort : 3306;
const poolLimit = Number.parseInt(process.env.DB_POOL_LIMIT || "20", 10) || 20;

const dbPassword = String(
  process.env.DB_PASSWORD || process.env.DB_PASS || ""
).trim();

const db = mysql.createPool({
  host: resolvedHost,
  port: dbPort,
  user: process.env.DB_USER || "root",
  password: dbPassword,
  database: process.env.DB_NAME || "gradious_portal",
  waitForConnections: true,
  connectionLimit: poolLimit,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

logger.info(
  `MySQL pool configured (host=${resolvedHost}, port=${dbPort}, poolLimit=${poolLimit})`
);

// ✅ Test DB connection
db.query("SELECT 1")
  .then(() => {
    logger.info("Database pool ready (SELECT 1 OK)");
  })
  .catch((err) => {
    logger.error("Database connection check failed:", err);
  });

module.exports = db;
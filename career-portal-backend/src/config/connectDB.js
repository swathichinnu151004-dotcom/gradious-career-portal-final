const mysql = require("mysql2/promise");
const logger = require("../utils/logger");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Swathi@123",
  database: process.env.DB_NAME || "gradious_portal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✅ Test DB connection
db.query("SELECT 1")
  .then(() => {
    logger.info("Database pool ready (SELECT 1 OK)");
  })
  .catch((err) => {
    logger.error("Database connection check failed:", err);
  });

module.exports = db;
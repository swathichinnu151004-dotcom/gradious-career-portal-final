const db = require("../config/connectDB");
const logger = require("./logger");

async function tryAlter(sql, label) {
  try {
    await db.query(sql);
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") return;
    if (e.code === "ER_DUP_KEYNAME") return;
    logger.warn(`[notifications] ${label}:`, e.code || "", e.message);
  }
}

/**
 * `user_id` is polymorphic: users.id (admin/user) OR recruiters.id (recruiter).
 * A legacy FK `user_id -> users(id)` breaks recruiter rows (ER_NO_REFERENCED_ROW_2).
 */
async function dropNotificationForeignKeys() {
  let rows;
  try {
    const [r] = await db.query(
      `SELECT DISTINCT CONSTRAINT_NAME AS cname
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'notifications'
         AND REFERENCED_TABLE_NAME IS NOT NULL`
    );
    rows = r;
  } catch (e) {
    logger.warn("[notifications] could not list foreign keys:", e.message);
    return;
  }

  for (const row of rows) {
    const raw = row.cname;
    if (!raw || !/^[a-zA-Z0-9_]+$/.test(String(raw))) continue;
    const cname = String(raw);
    try {
      await db.query(`ALTER TABLE notifications DROP FOREIGN KEY \`${cname}\``);
      logger.info(`[notifications] dropped foreign key: ${cname}`);
    } catch (e) {
      if (e.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
        logger.warn(`[notifications] drop FK ${cname}:`, e.message);
      }
    }
  }
}

/**
 * Ensures `notifications` exists and matches what the API expects.
 * Older DBs often had no `role` column — that breaks every WHERE role = ? query.
 */
async function ensureNotificationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      role VARCHAR(32) NOT NULL,
      sender_id INT NULL,
      type VARCHAR(64) NOT NULL DEFAULT 'system',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      related_id INT NULL,
      reference_type VARCHAR(32) NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_recipient_created (user_id, role, created_at),
      KEY idx_recipient_unread (user_id, role, is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await dropNotificationForeignKeys();

  // Legacy tables: add any columns missing from older schemas (CREATE IF NOT EXISTS does not upgrade).
  await tryAlter(
    "ALTER TABLE notifications ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user'",
    "add role"
  );
  await tryAlter(
    "ALTER TABLE notifications ADD COLUMN type VARCHAR(64) NOT NULL DEFAULT 'system'",
    "add type"
  );
  await tryAlter(
    "ALTER TABLE notifications ADD COLUMN related_id INT NULL",
    "add related_id"
  );
  await tryAlter(
    "ALTER TABLE notifications ADD COLUMN sender_id INT NULL",
    "add sender_id"
  );
  await tryAlter(
    "ALTER TABLE notifications ADD COLUMN reference_type VARCHAR(32) NULL",
    "add reference_type"
  );
  await tryAlter(
    "ALTER TABLE notifications ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0",
    "add is_read"
  );
  await tryAlter(
    "ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP",
    "add created_at"
  );

  try {
    await db.query(
      "ALTER TABLE notifications MODIFY COLUMN role VARCHAR(32) NOT NULL"
    );
  } catch (e) {
    logger.warn("[notifications] role modify skipped:", e.message);
  }

  try {
    await db.query(
      "ALTER TABLE notifications MODIFY COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0"
    );
  } catch (e) {
    logger.warn("[notifications] is_read modify skipped:", e.message);
  }

  logger.info("[notifications] schema ready");
}

module.exports = { ensureNotificationsTable };

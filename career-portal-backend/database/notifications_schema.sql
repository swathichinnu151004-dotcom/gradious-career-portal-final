-- Notifications storage for Career Portal (MySQL 8+)
-- Run this once against your database. If `notifications` already exists, use the ALTER block only.

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'Recipient user id',
  role VARCHAR(32) NOT NULL COMMENT 'Recipient role: admin | recruiter | user',
  sender_id INT NULL COMMENT 'Actor who triggered the notification, if any',
  type VARCHAR(64) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT NULL COMMENT 'Job id or application id',
  reference_type VARCHAR(32) NULL COMMENT 'job | application',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_recipient_created (user_id, role, created_at),
  KEY idx_recipient_unread (user_id, role, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If inserts fail with: ER_NO_REFERENCED_ROW_2 ... FOREIGN KEY (`user_id`) REFERENCES `users` (`id`):
-- `user_id` must allow recruiters.id (recruiters table), not only users.id. Drop that FK (name may differ):
-- SHOW CREATE TABLE notifications;
-- ALTER TABLE notifications DROP FOREIGN KEY notifications_ibfk_1;

-- If you already have an OLD `notifications` table (e.g. missing `role`), run these.
-- Ignore "Duplicate column" errors if a column already exists:
--
-- ALTER TABLE notifications ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user';
-- ALTER TABLE notifications ADD COLUMN type VARCHAR(64) NOT NULL DEFAULT 'info';
-- ALTER TABLE notifications ADD COLUMN related_id INT NULL;
-- ALTER TABLE notifications ADD COLUMN sender_id INT NULL;
-- ALTER TABLE notifications ADD COLUMN reference_type VARCHAR(32) NULL;

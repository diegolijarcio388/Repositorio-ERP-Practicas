CREATE TABLE IF NOT EXISTS permission_requests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  permission_date DATE NOT NULL,
  permission_type ENUM('FULL_DAY') NOT NULL DEFAULT 'FULL_DAY',
  reason TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  approver_id VARCHAR(64) NULL,
  approver_comment TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_permission_user_date (user_id, permission_date),
  INDEX idx_permission_department_date (department_id, permission_date),
  INDEX idx_permission_status (status),
  CONSTRAINT fk_permission_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_permission_approver FOREIGN KEY (approver_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

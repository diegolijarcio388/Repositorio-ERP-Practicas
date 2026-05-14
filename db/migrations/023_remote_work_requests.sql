CREATE TABLE IF NOT EXISTS remote_work_requests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  remote_work_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  approver_id VARCHAR(64) NULL,
  approver_comment TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_remote_work_user_date (user_id, remote_work_date),
  INDEX idx_remote_work_department_date (department_id, remote_work_date),
  INDEX idx_remote_work_status (status),
  CONSTRAINT fk_remote_work_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_remote_work_approver FOREIGN KEY (approver_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

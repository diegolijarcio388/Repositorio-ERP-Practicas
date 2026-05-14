CREATE TABLE IF NOT EXISTS workday_records (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  work_date DATE NOT NULL,
  check_in_at DATETIME(3) NOT NULL,
  check_out_at DATETIME(3) NULL,
  status ENUM('OPEN', 'COMPLETED', 'INCOMPLETE', 'INCIDENT') NOT NULL DEFAULT 'OPEN',
  worked_minutes INT NOT NULL DEFAULT 0,
  incident_flags JSON NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_workday_user_date (user_id, work_date),
  INDEX idx_workday_user_date (user_id, work_date),
  INDEX idx_workday_status (status),
  INDEX idx_workday_date (work_date),
  CONSTRAINT fk_workday_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

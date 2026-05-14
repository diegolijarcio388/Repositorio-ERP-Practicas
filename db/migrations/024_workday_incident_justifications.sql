CREATE TABLE IF NOT EXISTS workday_incident_justifications (
  id VARCHAR(64) PRIMARY KEY,
  record_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM(
    'PENDING_COORDINATOR',
    'PENDING_ADMIN',
    'APPROVED',
    'REJECTED'
  ) NOT NULL DEFAULT 'PENDING_COORDINATOR',
  coordinator_comment TEXT NULL,
  admin_comment TEXT NULL,
  reviewed_by_coordinator_id VARCHAR(64) NULL,
  reviewed_by_admin_id VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_workday_incident_justification_record (record_id),
  INDEX idx_workday_incident_justification_user (user_id),
  INDEX idx_workday_incident_justification_status (status),
  INDEX idx_workday_incident_justification_coordinator (reviewed_by_coordinator_id),
  INDEX idx_workday_incident_justification_admin (reviewed_by_admin_id),
  CONSTRAINT fk_workday_incident_justification_record
    FOREIGN KEY (record_id) REFERENCES workday_records(id),
  CONSTRAINT fk_workday_incident_justification_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_workday_incident_justification_coordinator
    FOREIGN KEY (reviewed_by_coordinator_id) REFERENCES users(id),
  CONSTRAINT fk_workday_incident_justification_admin
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

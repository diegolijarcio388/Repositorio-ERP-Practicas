CREATE TABLE IF NOT EXISTS caff_time_entries (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  section ENUM('VARIOS_CAF', 'REUNION_CAF', 'INCIDENCIAS_CAF') NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  description TEXT NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_caff_user_date (user_id, date),
  INDEX idx_caff_section (section),
  CONSTRAINT fk_caff_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_caff_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Añade modo BOLSA_HORAS a hour_tracking_mode y tabla de líneas de bolsa de horas
ALTER TABLE projects
  MODIFY COLUMN hour_tracking_mode ENUM('GENERAL', 'STRUCTURED', 'BUILDING_BLOCK', 'BOLSA_HORAS') NOT NULL DEFAULT 'GENERAL';

CREATE TABLE IF NOT EXISTS project_hour_bag_entries (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  assigned_user_id VARCHAR(64) NULL,
  company VARCHAR(255) NOT NULL,
  purchase_order_number VARCHAR(128) NOT NULL,
  external_project_name VARCHAR(255) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  building_block VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  area VARCHAR(255) NOT NULL,
  resource_name VARCHAR(255) NOT NULL,
  hours DECIMAL(7,2) NULL,
  date DATE NULL,
  created_by VARCHAR(64) NOT NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_hour_bag_project (project_id),
  INDEX idx_hour_bag_date (date),
  CONSTRAINT fk_hour_bag_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_hour_bag_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users(id),
  CONSTRAINT fk_hour_bag_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_hour_bag_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

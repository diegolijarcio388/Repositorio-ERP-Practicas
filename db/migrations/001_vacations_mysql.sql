CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  coordinator_user_id VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  department_id VARCHAR(64) NOT NULL,
  role ENUM('worker', 'coordinator', 'admin') NOT NULL,
  INDEX idx_users_department (department_id),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS vacation_requests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  days_json JSON NOT NULL,
  status ENUM('PENDING', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
  approver_id VARCHAR(64) NULL,
  approver_comment TEXT NULL,
  created_by_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_vacation_requests_user (user_id),
  INDEX idx_vacation_requests_dept (department_id),
  CONSTRAINT fk_vacation_requests_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_vacation_requests_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS vacation_blocks (
  id VARCHAR(64) PRIMARY KEY,
  department_id VARCHAR(64) NOT NULL,
  days_json JSON NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  reason VARCHAR(255) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_vacation_blocks_department (department_id),
  CONSTRAINT fk_vacation_blocks_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_vacation_blocks_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  type ENUM('HOLIDAY', 'EVENT') NOT NULL,
  scope ENUM('GLOBAL', 'DEPARTMENT') NOT NULL,
  department_id VARCHAR(64) NULL,
  days_json JSON NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  all_day TINYINT(1) NOT NULL DEFAULT 1,
  blocks_selection TINYINT(1) NOT NULL DEFAULT 0,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_calendar_events_department (department_id),
  CONSTRAINT fk_calendar_events_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_calendar_events_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS vacation_events_history (
  id VARCHAR(64) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  from_status ENUM('PENDING', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED') NULL,
  to_status ENUM('PENDING', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
  changed_by VARCHAR(64) NOT NULL,
  comment TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_vacation_history_request (request_id),
  CONSTRAINT fk_vacation_history_request FOREIGN KEY (request_id) REFERENCES vacation_requests(id),
  CONSTRAINT fk_vacation_history_changer FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  to_user_id VARCHAR(64) NOT NULL,
  type VARCHAR(128) NOT NULL,
  payload_json JSON NOT NULL,
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_notifications_to_user (to_user_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (to_user_id) REFERENCES users(id)
);

ALTER TABLE vacation_requests
  MODIFY COLUMN status ENUM('PENDING', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL;

ALTER TABLE vacation_events_history
  MODIFY COLUMN from_status ENUM('PENDING', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED') NULL;

ALTER TABLE vacation_events_history
  MODIFY COLUMN to_status ENUM('PENDING', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL;

ALTER TABLE users
ADD COLUMN can_manage_time_control_requests TINYINT(1) NOT NULL DEFAULT 0
AFTER role;

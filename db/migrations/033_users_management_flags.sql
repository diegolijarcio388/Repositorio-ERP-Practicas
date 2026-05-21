ALTER TABLE users
  ADD COLUMN IF NOT EXISTS can_manage_vacations TINYINT(1) NOT NULL DEFAULT 0
  AFTER time_control_device_policy;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS can_manage_projects TINYINT(1) NOT NULL DEFAULT 0
  AFTER can_manage_vacations;

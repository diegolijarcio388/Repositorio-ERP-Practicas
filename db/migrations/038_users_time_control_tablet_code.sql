ALTER TABLE users
  ADD COLUMN time_control_tablet_code VARCHAR(16) NULL
  AFTER time_control_device_policy;

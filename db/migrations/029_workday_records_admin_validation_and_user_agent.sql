ALTER TABLE workday_records
  ADD COLUMN check_in_user_agent TEXT NULL AFTER check_out_ip_address,
  ADD COLUMN check_out_user_agent TEXT NULL AFTER check_in_user_agent,
  ADD COLUMN requires_admin_validation TINYINT(1) NOT NULL DEFAULT 0 AFTER check_out_device_reason,
  ADD COLUMN admin_validation_reason VARCHAR(40) NULL AFTER requires_admin_validation;

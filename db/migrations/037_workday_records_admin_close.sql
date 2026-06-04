ALTER TABLE workday_records
  ADD COLUMN admin_close_comment TEXT NULL AFTER admin_validation_comment,
  ADD COLUMN closed_by_admin_id VARCHAR(255) NULL AFTER admin_close_comment,
  ADD COLUMN closed_by_admin_at DATETIME(3) NULL AFTER closed_by_admin_id;

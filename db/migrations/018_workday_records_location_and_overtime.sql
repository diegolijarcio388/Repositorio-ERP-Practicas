ALTER TABLE workday_records
  ADD COLUMN overtime_minutes INT NOT NULL DEFAULT 0 AFTER worked_minutes,
  ADD COLUMN check_in_latitude DECIMAL(10,7) NOT NULL AFTER incident_flags,
  ADD COLUMN check_in_longitude DECIMAL(10,7) NOT NULL AFTER check_in_latitude,
  ADD COLUMN check_out_latitude DECIMAL(10,7) NULL AFTER check_in_longitude,
  ADD COLUMN check_out_longitude DECIMAL(10,7) NULL AFTER check_out_latitude;

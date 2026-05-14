ALTER TABLE workday_records
  ADD COLUMN check_in_device_type ENUM('MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN' AFTER check_out_longitude,
  ADD COLUMN check_out_device_type ENUM('MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN') NULL AFTER check_in_device_type,
  ADD COLUMN check_in_ip_address VARCHAR(64) NULL AFTER check_out_device_type,
  ADD COLUMN check_out_ip_address VARCHAR(64) NULL AFTER check_in_ip_address;

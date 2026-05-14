ALTER TABLE workday_records
  ADD COLUMN check_in_device_reason VARCHAR(255) NULL AFTER check_out_ip_address,
  ADD COLUMN check_out_device_reason VARCHAR(255) NULL AFTER check_in_device_reason;

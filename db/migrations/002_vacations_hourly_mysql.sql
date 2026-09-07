ALTER TABLE vacation_requests
  ADD COLUMN request_type ENUM('FULL_DAY', 'HOURLY') NOT NULL DEFAULT 'FULL_DAY' AFTER days_json,
  ADD COLUMN hour_ranges_json JSON NULL AFTER request_type,
  ADD COLUMN hours_total DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER hour_ranges_json,
  ADD COLUMN uses_hour_bank TINYINT(1) NOT NULL DEFAULT 0 AFTER hours_total;


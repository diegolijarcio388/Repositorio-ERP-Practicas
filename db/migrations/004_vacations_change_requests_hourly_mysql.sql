ALTER TABLE vacation_requests
  ADD COLUMN proposed_hour_ranges_json JSON NULL AFTER proposed_days_json,
  ADD COLUMN proposed_hours_total DECIMAL(5,2) NULL AFTER proposed_hour_ranges_json;

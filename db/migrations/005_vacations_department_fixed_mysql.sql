ALTER TABLE vacation_requests
  ADD COLUMN IF NOT EXISTS fixed_by_department TINYINT(1) NOT NULL DEFAULT 0 AFTER created_by_admin;

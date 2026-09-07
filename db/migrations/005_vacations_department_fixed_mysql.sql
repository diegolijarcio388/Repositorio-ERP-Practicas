ALTER TABLE vacation_requests
  ADD COLUMN fixed_by_department TINYINT(1) NOT NULL DEFAULT 0 AFTER created_by_admin;

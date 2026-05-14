ALTER TABLE vacation_requests
  ADD COLUMN IF NOT EXISTS request_title VARCHAR(120) NULL AFTER department_id;

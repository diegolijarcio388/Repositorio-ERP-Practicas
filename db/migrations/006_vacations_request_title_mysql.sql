ALTER TABLE vacation_requests
  ADD COLUMN request_title VARCHAR(120) NULL AFTER department_id;

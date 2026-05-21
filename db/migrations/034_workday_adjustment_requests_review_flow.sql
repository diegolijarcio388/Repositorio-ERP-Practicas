ALTER TABLE workday_adjustment_requests
  MODIFY COLUMN status ENUM(
    'PENDING',
    'PENDING_COORDINATOR',
    'PENDING_ADMIN',
    'APPROVED',
    'REJECTED'
  ) NOT NULL DEFAULT 'PENDING_COORDINATOR';

ALTER TABLE workday_adjustment_requests
  ADD COLUMN coordinator_comment TEXT NULL AFTER status,
  ADD COLUMN admin_comment TEXT NULL AFTER coordinator_comment,
  ADD COLUMN reviewed_by_coordinator_id VARCHAR(255) NULL AFTER admin_comment,
  ADD COLUMN reviewed_by_admin_id VARCHAR(255) NULL AFTER reviewed_by_coordinator_id;

UPDATE workday_adjustment_requests
SET status = 'PENDING_COORDINATOR'
WHERE status = 'PENDING';

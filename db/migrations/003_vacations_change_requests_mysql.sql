ALTER TABLE vacation_requests
  MODIFY COLUMN status ENUM(
    'PENDING',
    'PENDING_ADMIN',
    'CHANGE_PENDING_COORDINATOR',
    'CHANGE_PENDING_ADMIN',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
  ) NOT NULL;

ALTER TABLE vacation_events_history
  MODIFY COLUMN from_status ENUM(
    'PENDING',
    'PENDING_ADMIN',
    'CHANGE_PENDING_COORDINATOR',
    'CHANGE_PENDING_ADMIN',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
  ) NULL;

ALTER TABLE vacation_events_history
  MODIFY COLUMN to_status ENUM(
    'PENDING',
    'PENDING_ADMIN',
    'CHANGE_PENDING_COORDINATOR',
    'CHANGE_PENDING_ADMIN',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
  ) NOT NULL;

ALTER TABLE vacation_requests
  ADD COLUMN IF NOT EXISTS proposed_days_json JSON NULL AFTER approver_comment,
  ADD COLUMN IF NOT EXISTS change_request_comment TEXT NULL AFTER proposed_days_json,
  ADD COLUMN IF NOT EXISTS change_origin_status ENUM('PENDING_ADMIN', 'APPROVED') NULL AFTER change_request_comment;

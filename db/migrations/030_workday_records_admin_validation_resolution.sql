ALTER TABLE workday_records
  ADD COLUMN admin_validation_status VARCHAR(20) NULL AFTER admin_validation_reason,
  ADD COLUMN admin_validated_by VARCHAR(64) NULL AFTER admin_validation_status,
  ADD COLUMN admin_validated_at DATETIME(3) NULL AFTER admin_validated_by,
  ADD COLUMN admin_validation_comment TEXT NULL AFTER admin_validated_at;

UPDATE workday_records
SET admin_validation_status = 'PENDING'
WHERE requires_admin_validation = 1
  AND admin_validation_status IS NULL;

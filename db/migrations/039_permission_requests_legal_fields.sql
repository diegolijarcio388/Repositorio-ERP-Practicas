-- Campos legales basicos para solicitudes de permisos.
-- Si hay registros antiguos en PENDING, se pasan al flujo actual antes de ajustar el ENUM.
UPDATE permission_requests
SET status = 'PENDING_COORDINATOR'
WHERE status = 'PENDING';

ALTER TABLE permission_requests
  MODIFY COLUMN status ENUM(
    'PENDING_COORDINATOR',
    'PENDING_ADMIN',
    'APPROVED',
    'REJECTED'
  ) NOT NULL DEFAULT 'PENDING_COORDINATOR',
  ADD COLUMN IF NOT EXISTS legal_permission_type VARCHAR(64) NULL AFTER permission_type,
  ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500) NULL AFTER legal_permission_type,
  ADD COLUMN IF NOT EXISTS requested_units INT NULL AFTER attachment_url,
  ADD COLUMN IF NOT EXISTS requested_unit_type VARCHAR(32) NULL AFTER requested_units;

ALTER TABLE permission_requests
  MODIFY COLUMN attachment_url TEXT NULL;

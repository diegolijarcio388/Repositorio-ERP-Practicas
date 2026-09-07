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
  ADD COLUMN legal_permission_type VARCHAR(64) NULL AFTER permission_type,
  ADD COLUMN attachment_url VARCHAR(500) NULL AFTER legal_permission_type,
  ADD COLUMN requested_units INT NULL AFTER attachment_url,
  ADD COLUMN requested_unit_type VARCHAR(32) NULL AFTER requested_units;

ALTER TABLE permission_requests
  MODIFY COLUMN attachment_url TEXT NULL;

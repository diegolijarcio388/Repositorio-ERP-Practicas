-- Migración para añadir soporte al flujo Coordinador -> Admin
-- en las solicitudes de fichaje anterior.

ALTER TABLE workday_adjustment_requests
MODIFY COLUMN status ENUM('PENDING', 'PENDING_COORDINATOR', 'PENDING_ADMIN', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING_COORDINATOR',
ADD COLUMN coordinator_comment TEXT NULL AFTER status,
ADD COLUMN admin_comment TEXT NULL AFTER coordinator_comment,
ADD COLUMN reviewed_by_coordinator_id VARCHAR(255) NULL AFTER admin_comment,
ADD COLUMN reviewed_by_admin_id VARCHAR(255) NULL AFTER reviewed_by_coordinator_id;

-- Actualizar los registros PENDING antiguos al nuevo estado PENDING_COORDINATOR
UPDATE workday_adjustment_requests
SET status = 'PENDING_COORDINATOR'
WHERE status = 'PENDING';

-- (Opcional) Si quieres limpiar las columnas antiguas que ya no se usan
-- ALTER TABLE workday_adjustment_requests DROP COLUMN reviewed_by;
-- ALTER TABLE workday_adjustment_requests DROP COLUMN review_comment;

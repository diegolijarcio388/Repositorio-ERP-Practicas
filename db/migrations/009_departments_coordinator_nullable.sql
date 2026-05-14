-- Permite crear departamentos sin coordinador asignado
ALTER TABLE departments
  MODIFY COLUMN coordinator_user_id VARCHAR(64) NULL;

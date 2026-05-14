-- Ajusta bolsa de horas: fila asignada por trabajador y horas/fecha editables
ALTER TABLE project_hour_bag_entries
  ADD COLUMN assigned_user_id VARCHAR(64) NULL AFTER project_id;

ALTER TABLE project_hour_bag_entries
  ADD INDEX idx_hour_bag_assigned_user (assigned_user_id);

ALTER TABLE project_hour_bag_entries
  ADD CONSTRAINT fk_hour_bag_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users(id);

ALTER TABLE project_hour_bag_entries
  MODIFY COLUMN hours DECIMAL(7,2) NULL,
  MODIFY COLUMN date DATE NULL;

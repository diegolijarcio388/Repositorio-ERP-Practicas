-- Añade modo BUILDING_BLOCK a hour_tracking_mode
ALTER TABLE projects
  MODIFY COLUMN hour_tracking_mode ENUM('GENERAL', 'STRUCTURED', 'BUILDING_BLOCK') NOT NULL DEFAULT 'GENERAL';

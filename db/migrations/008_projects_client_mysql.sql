-- Reemplaza el campo type (PUBLIC/PRIVATE) por client_name de forma idempotente
SET @has_type := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND COLUMN_NAME = 'type'
);

SET @drop_type_sql := IF(
  @has_type > 0,
  'ALTER TABLE projects DROP COLUMN `type`',
  'SELECT 1'
);
PREPARE stmt_drop_type FROM @drop_type_sql;
EXECUTE stmt_drop_type;
DEALLOCATE PREPARE stmt_drop_type;

SET @has_client_name := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'projects'
    AND COLUMN_NAME = 'client_name'
);

SET @add_client_name_sql := IF(
  @has_client_name = 0,
  'ALTER TABLE projects ADD COLUMN `client_name` VARCHAR(255) NULL AFTER `name`',
  'SELECT 1'
);
PREPARE stmt_add_client_name FROM @add_client_name_sql;
EXECUTE stmt_add_client_name;
DEALLOCATE PREPARE stmt_add_client_name;

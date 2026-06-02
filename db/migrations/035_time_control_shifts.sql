CREATE TABLE IF NOT EXISTS time_control_shifts (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  allows_overnight TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS time_control_shift_segments (
  id VARCHAR(64) PRIMARY KEY,
  shift_id VARCHAR(64) NOT NULL,
  segment_order INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  tolerance_start_minutes INT NOT NULL DEFAULT 30,
  tolerance_end_minutes INT NOT NULL DEFAULT 30,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_time_control_shift_segment_order (shift_id, segment_order),
  CONSTRAINT fk_time_control_shift_segment_shift
    FOREIGN KEY (shift_id) REFERENCES time_control_shifts(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS time_control_shift_id VARCHAR(64) NULL
  AFTER time_control_device_policy;

INSERT IGNORE INTO time_control_shifts (
  id,
  name,
  description,
  is_active,
  allows_overnight,
  created_at,
  updated_at
) VALUES
  (
    'shift-standard',
    'Turno estandar',
    'Jornada continua diurna de referencia.',
    1,
    0,
    NOW(3),
    NOW(3)
  ),
  (
    'shift-split',
    'Turno partido',
    'Jornada partida en dos tramos dentro del mismo dia.',
    1,
    0,
    NOW(3),
    NOW(3)
  ),
  (
    'shift-night',
    'Turno nocturno',
    'Jornada continua que cruza la medianoche.',
    1,
    1,
    NOW(3),
    NOW(3)
  );

INSERT IGNORE INTO time_control_shift_segments (
  id,
  shift_id,
  segment_order,
  start_time,
  end_time,
  tolerance_start_minutes,
  tolerance_end_minutes,
  created_at,
  updated_at
) VALUES
  (
    'shift-standard-segment-1',
    'shift-standard',
    1,
    '08:00:00',
    '16:00:00',
    30,
    30,
    NOW(3),
    NOW(3)
  ),
  (
    'shift-split-segment-1',
    'shift-split',
    1,
    '08:00:00',
    '14:00:00',
    30,
    30,
    NOW(3),
    NOW(3)
  ),
  (
    'shift-split-segment-2',
    'shift-split',
    2,
    '16:00:00',
    '18:00:00',
    30,
    30,
    NOW(3),
    NOW(3)
  ),
  (
    'shift-night-segment-1',
    'shift-night',
    1,
    '22:00:00',
    '06:00:00',
    30,
    30,
    NOW(3),
    NOW(3)
  );

UPDATE users
SET time_control_shift_id = COALESCE(time_control_shift_id, 'shift-standard');

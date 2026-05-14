-- ============================================================
-- Módulo de Gestión de Proyectos
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PRIVATE',
  status ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget_hours DECIMAL(10,2) NULL,
  -- GENERAL: presupuesto total; STRUCTURED: por paquetes de trabajo y tareas
  hour_tracking_mode ENUM('GENERAL', 'STRUCTURED') NOT NULL DEFAULT 'GENERAL',
  manager_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_projects_code (code),
  INDEX idx_projects_manager (manager_id),
  INDEX idx_projects_status (status),
  CONSTRAINT fk_projects_manager FOREIGN KEY (manager_id) REFERENCES users(id),
  CONSTRAINT fk_projects_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Paquetes de trabajo (solo en modo STRUCTURED)
-- Incluyen fechas para el cronograma
CREATE TABLE IF NOT EXISTS project_work_packages (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  budget_hours DECIMAL(10,2) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  position INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_work_packages_project (project_id),
  CONSTRAINT fk_work_packages_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tareas (dentro de un paquete en modo STRUCTURED, o directamente en el proyecto en GENERAL)
-- La tarea "General" (is_default=1) se crea automáticamente al crear el proyecto
CREATE TABLE IF NOT EXISTS project_tasks (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  work_package_id VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  budget_hours DECIMAL(10,2) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_tasks_project (project_id),
  INDEX idx_tasks_work_package (work_package_id),
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_work_package FOREIGN KEY (work_package_id) REFERENCES project_work_packages(id) ON DELETE CASCADE
);

-- Asignación de trabajadores al proyecto (controla visibilidad)
CREATE TABLE IF NOT EXISTS project_assignments (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  assigned_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_project_user (project_id, user_id),
  INDEX idx_assignments_project (project_id),
  INDEX idx_assignments_user (user_id),
  CONSTRAINT fk_assignments_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_assignments_assigner FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Asignación de trabajadores a tareas específicas (controla en qué tareas puede imputar horas)
-- Un trabajador asignado al proyecto ve toda la estructura pero solo imputa en sus tareas asignadas
CREATE TABLE IF NOT EXISTS project_task_assignments (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  task_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  assigned_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_task_user (task_id, user_id),
  INDEX idx_task_assignments_project (project_id),
  INDEX idx_task_assignments_task (task_id),
  INDEX idx_task_assignments_user (user_id),
  CONSTRAINT fk_task_assignments_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_assignments_task FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_assignments_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Imputaciones de horas a tareas de proyectos
CREATE TABLE IF NOT EXISTS project_time_entries (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  task_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  description TEXT NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_pte_project (project_id),
  INDEX idx_pte_task (task_id),
  INDEX idx_pte_user_date (user_id, date),
  CONSTRAINT fk_pte_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_pte_task FOREIGN KEY (task_id) REFERENCES project_tasks(id),
  CONSTRAINT fk_pte_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_pte_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Imputaciones de horas a categorías internas fijas (disponibles para todos los trabajadores)
CREATE TABLE IF NOT EXISTS internal_time_entries (
  id VARCHAR(64) PRIMARY KEY,
  category ENUM(
    'GESTION_DPTO_IDI',
    'VARIOS_DPTO_IDI',
    'FERIAS_JORNADAS',
    'FORMACION_RECIBIDA',
    'VACACIONES',
    'BAJA_LABORAL',
    'PERMISO_MEDICO',
    'ASUNTOS_PROPIOS',
    'PERMISO_RETRIBUIDO',
    'FORMACION_IMPARTIDA',
    'ACTIVIDADES_COMERCIALES',
    'PREVENCION_RRLL',
    'VIGILANCIAS_TECNOLOGICAS',
    'PROGRAMAS_CONVOCATORIAS'
  ) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  description TEXT NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  updated_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_ite_user_date (user_id, date),
  CONSTRAINT fk_ite_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_ite_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Partidas presupuestarias del proyecto (Viajes 3000€, Personal, Materiales…)
CREATE TABLE IF NOT EXISTS project_budget_partitions (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  budget_amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_budget_partitions_project (project_id),
  CONSTRAINT fk_budget_partitions_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Gastos imputados a partidas presupuestarias
-- Flujo: PENDING → APPROVED / REJECTED (aprobado por coordinador/admin)
CREATE TABLE IF NOT EXISTS project_expenses (
  id VARCHAR(64) PRIMARY KEY,
  partition_id VARCHAR(64) NOT NULL,
  project_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  receipt_url VARCHAR(512) NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  reviewed_by VARCHAR(64) NULL,
  reviewed_at DATETIME(3) NULL,
  rejection_reason TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_expenses_partition (partition_id),
  INDEX idx_expenses_project (project_id),
  INDEX idx_expenses_user (user_id),
  INDEX idx_expenses_status (status),
  CONSTRAINT fk_expenses_partition FOREIGN KEY (partition_id) REFERENCES project_budget_partitions(id),
  CONSTRAINT fk_expenses_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users(id)
);

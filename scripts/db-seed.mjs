import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const loadEnvFromFile = () => {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env es opcional; si no existe se usan variables del entorno.
  }
};

loadEnvFromFile();

const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("MYSQL_URL o DATABASE_URL requerido.");

const now = new Date().toISOString().slice(0, 23).replace("T", " ");

const pool = mysql.createPool({ uri: databaseUrl });

try {
  // Datos completamente ficticios para desarrollo y demostraciones.
  await pool.query("DELETE FROM notifications");
  await pool.query("DELETE FROM vacation_events_history");
  await pool.query("DELETE FROM vacation_blocks");
  await pool.query("DELETE FROM calendar_events");
  await pool.query("DELETE FROM vacation_requests");
  await pool.query("DELETE FROM users");
  await pool.query("DELETE FROM departments");

  await pool.query(
    `INSERT INTO departments (id, name, coordinator_user_id) VALUES
      ('dep-direccion', 'Dirección de ejemplo', 'u-admin-1'),
      ('dep-operaciones', 'Operaciones de ejemplo', 'u-worker-ops-1'),
      ('dep-ingenieria', 'Ingeniería de ejemplo', 'u-coord-eng-1'),
      ('dep-servicios', 'Servicios de ejemplo', 'u-coord-services-1')`,
  );

  await pool.query(
    `INSERT INTO users (
      id,
      name,
      job_title,
      email,
      department_id,
      role,
      can_manage_time_control_requests,
      time_control_device_policy,
      can_manage_vacations,
      can_manage_projects
    ) VALUES
      ('u-admin-1', 'Administrador Demo 1', NULL, 'admin1@example.com', 'dep-direccion', 'admin', 1, 'TABLET_OR_MOBILE', 1, 1),
      ('u-admin-2', 'Administrador Demo 2', NULL, 'admin2@example.com', 'dep-direccion', 'admin', 1, 'TABLET_OR_MOBILE', 1, 1),
      ('u-coord-ops-1', 'Coordinación Operaciones Demo', NULL, 'coord.operaciones@example.com', 'dep-operaciones', 'coordinator', 1, 'TABLET_OR_MOBILE', 1, 0),
      ('u-worker-ops-1', 'Usuario Operaciones Demo 1', NULL, 'operaciones1@example.com', 'dep-operaciones', 'admin', 1, 'TABLET_OR_MOBILE', 1, 1),
      ('u-coord-eng-1', 'Coordinación Ingeniería Demo', NULL, 'coord.ingenieria@example.com', 'dep-ingenieria', 'coordinator', 1, 'TABLET_OR_MOBILE', 1, 0),
      ('u-worker-eng-1', 'Usuario Ingeniería Demo 1', NULL, 'ingenieria1@example.com', 'dep-ingenieria', 'worker', 0, 'TABLET_ONLY', 0, 0),
      ('u-worker-eng-2', 'Usuario Ingeniería Demo 2', NULL, 'ingenieria2@example.com', 'dep-ingenieria', 'worker', 0, 'TABLET_ONLY', 0, 0),
      ('u-coord-services-1', 'Coordinación Servicios Demo', NULL, 'coord.servicios@example.com', 'dep-servicios', 'coordinator', 1, 'TABLET_OR_MOBILE', 1, 1),
      ('u-worker-services-1', 'Usuario Servicios Demo 1', NULL, 'servicios1@example.com', 'dep-servicios', 'worker', 0, 'TABLET_ONLY', 0, 0)`,
  );

  await pool.query(
    `INSERT INTO calendar_events (
      id, title, description, type, scope, department_id, days_json, start_date, end_date,
      all_day, blocks_selection, created_by, created_at, updated_at
    ) VALUES
      ('cal-1', 'Día no laborable de ejemplo 01', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-01-09"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-2', 'Día no laborable de ejemplo 02', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-02-06"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-3', 'Día no laborable de ejemplo 03', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-03-13"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-4', 'Día no laborable de ejemplo 04', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-04-17"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-5', 'Día no laborable de ejemplo 05', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-05-22"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-6', 'Día no laborable de ejemplo 06', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-06-26"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-7', 'Día no laborable de ejemplo 07', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-07-10"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-8', 'Día no laborable de ejemplo 08', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-08-21"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-9', 'Día no laborable de ejemplo 09', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-09-18"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-10', 'Día no laborable de ejemplo 10', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-10-23"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-11', 'Día no laborable de ejemplo 11', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-11-06"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-12', 'Día no laborable de ejemplo 12', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-11-20"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-13', 'Día no laborable de ejemplo 13', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-12-04"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-14', 'Día no laborable de ejemplo 14', 'Fecha ficticia para demostraciones', 'HOLIDAY', 'GLOBAL', NULL, '["2026-12-18"]', NULL, NULL, 1, 1, 'u-admin-1', ?, ?),
      ('cal-15', 'Jornada interna de ejemplo', 'Evento ficticio no bloqueante', 'EVENT', 'DEPARTMENT', 'dep-ingenieria', '["2026-03-16"]', NULL, NULL, 1, 0, 'u-admin-1', ?, ?)` ,
    Array(30).fill(now),
  );

  await pool.query(
    `INSERT INTO vacation_blocks (id, department_id, days_json, start_date, end_date, reason, created_by, created_at)
     VALUES ('vblock-1', 'dep-ingenieria', '["2026-08-14"]', NULL, NULL, 'Bloqueo ficticio de ejemplo', 'u-coord-eng-1', ?)`,
    [now],
  );

  console.log("Seed completado.");
} finally {
  await pool.end();
}

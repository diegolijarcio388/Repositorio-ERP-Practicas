import { readdir, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

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
if (!databaseUrl) {
  throw new Error("MYSQL_URL o DATABASE_URL requerido.");
}

const migrationsDir = resolve(process.cwd(), "db/migrations");
const migrationFiles = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));

const pool = mysql.createPool({ uri: databaseUrl });

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    )
  `);
};

const getAppliedMigrations = async () => {
  const [rows] = await pool.query(
    "SELECT filename FROM schema_migrations ORDER BY filename",
  );
  return new Set(rows.map((row) => row.filename));
};

const hasColumn = async (tableName, columnName) => {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [tableName, columnName],
  );
  return rows[0].total > 0;
};

const hasTable = async (tableName) => {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [tableName],
  );
  return rows[0].total > 0;
};

const maybeBaselineExistingSchema = async (appliedMigrations) => {
  if (appliedMigrations.size > 0) return appliedMigrations;

  const schemaChecks = await Promise.all([
    hasColumn("users", "job_title"),
    hasColumn("users", "can_manage_time_control_requests"),
    hasColumn("users", "time_control_device_policy"),
    hasColumn("users", "can_manage_vacations"),
    hasColumn("users", "can_manage_projects"),
    hasColumn("workday_adjustment_requests", "coordinator_comment"),
    hasColumn("workday_adjustment_requests", "reviewed_by_admin_id"),
    hasColumn("workday_incident_justifications", "hidden_by_worker"),
    hasColumn("workday_records", "admin_validation_reason"),
    hasTable("time_control_allowed_locations"),
  ]);

  const schemaLooksFullyMigrated = schemaChecks.every(Boolean);
  if (!schemaLooksFullyMigrated) return appliedMigrations;

  if (migrationFiles.length === 0) return appliedMigrations;
  const valuesPlaceholders = migrationFiles.map(() => "(?, NOW(3))").join(", ");
  await pool.query(
    `INSERT IGNORE INTO schema_migrations (filename, applied_at) VALUES ${valuesPlaceholders}`,
    migrationFiles,
  );
  console.log(
    `Baseline inicializado en schema_migrations (${migrationFiles.length} migraciones marcadas como aplicadas).`,
  );
  return new Set(migrationFiles);
};

try {
  await ensureMigrationsTable();
  let appliedMigrations = await getAppliedMigrations();
  appliedMigrations = await maybeBaselineExistingSchema(appliedMigrations);

  for (const migrationFile of migrationFiles) {
    if (appliedMigrations.has(migrationFile)) {
      continue;
    }

    const migrationPath = resolve(migrationsDir, migrationFile);
    const sql = await readFile(migrationPath, "utf8");
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/g)
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await pool.query(statement);
    }
    await pool.query(
      "INSERT INTO schema_migrations (filename, applied_at) VALUES (?, NOW(3))",
      [migrationFile],
    );
    console.log(`Migration aplicada: ${migrationFile}`);
  }
} finally {
  await pool.end();
}

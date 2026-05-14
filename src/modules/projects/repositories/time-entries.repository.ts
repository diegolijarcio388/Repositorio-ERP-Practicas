import { getMySqlPool } from "../../../core/db/mysql";
import type {
  InternalCategory,
  InternalTimeEntryFilters,
  InternalTimeEntryRecord,
  ProjectTimeEntryFilters,
  ProjectTimeEntryRecord,
  TimeEntryReviewStatus,
} from "../domain/types";

// ── Row types ────────────────────────────────────────────────────────────────

interface DbProjectTimeEntryRow {
  id: string;
  project_id: string;
  task_id: string;
  user_id: string;
  project_name?: string;
  task_name?: string;
  user_name?: string;
  date: string;
  hours: string | number;
  description: string;
  review_status: TimeEntryReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DbInternalTimeEntryRow {
  id: string;
  category: InternalCategory;
  user_id: string;
  date: string;
  hours: string | number;
  description: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapProjectEntry = (row: DbProjectTimeEntryRow): ProjectTimeEntryRecord => ({
  id: row.id,
  projectId: row.project_id,
  taskId: row.task_id,
  userId: row.user_id,
  projectName: row.project_name,
  taskName: row.task_name,
  userName: row.user_name,
  date: row.date,
  hours: Number(row.hours),
  description: row.description,
  reviewStatus: row.review_status,
  reviewedBy: row.reviewed_by,
  reviewedAt: row.reviewed_at,
  rejectionReason: row.rejection_reason,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapInternalEntry = (row: DbInternalTimeEntryRow): InternalTimeEntryRecord => ({
  id: row.id,
  category: row.category,
  userId: row.user_id,
  date: row.date,
  hours: Number(row.hours),
  description: row.description,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ── Repository ────────────────────────────────────────────────────────────────

class TimeEntriesRepository {
  private get pool() {
    return getMySqlPool();
  }

  // ── Project time entries ──────────────────────────────────────────────────

  async listProjectEntries(filters: ProjectTimeEntryFilters): Promise<ProjectTimeEntryRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.userId) { conditions.push("te.user_id = ?"); values.push(filters.userId); }
    if (filters.projectId) { conditions.push("te.project_id = ?"); values.push(filters.projectId); }
    if (filters.taskId) { conditions.push("te.task_id = ?"); values.push(filters.taskId); }
    if (filters.taskName) { conditions.push("t.name LIKE ?"); values.push(`%${filters.taskName.trim()}%`); }
    if (filters.dateFrom) { conditions.push("te.date >= ?"); values.push(filters.dateFrom); }
    if (filters.dateTo) { conditions.push("te.date <= ?"); values.push(filters.dateTo); }
    if (filters.reviewStatus) { conditions.push("te.review_status = ?"); values.push(filters.reviewStatus); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await this.pool.query<DbProjectTimeEntryRow[]>(
      `SELECT
         te.*,
         p.name AS project_name,
         t.name AS task_name,
         u.name AS user_name
       FROM project_time_entries te
       LEFT JOIN projects p ON p.id = te.project_id
       LEFT JOIN project_tasks t ON t.id = te.task_id
       LEFT JOIN users u ON u.id = te.user_id
       ${where}
       ORDER BY te.date DESC, te.created_at DESC`,
      values,
    );
    return rows.map(mapProjectEntry);
  }

  async getProjectEntryById(id: string): Promise<ProjectTimeEntryRecord | null> {
    const [rows] = await this.pool.query<DbProjectTimeEntryRow[]>(
      "SELECT * FROM project_time_entries WHERE id = ?",
      [id],
    );
    return rows[0] ? mapProjectEntry(rows[0]) : null;
  }

  async createProjectEntry(
    projectId: string,
    taskId: string,
    userId: string,
    date: string,
    hours: number,
    description: string,
    createdBy: string,
  ): Promise<ProjectTimeEntryRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT INTO project_time_entries
         (id, project_id, task_id, user_id, date, hours, description, review_status, reviewed_by, reviewed_at,
          rejection_reason, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, NULL, NULL, ?, NULL, ?, ?)`,
      [id, projectId, taskId, userId, date, hours, description.trim(), createdBy, now, now],
    );
    return (await this.getProjectEntryById(id))!;
  }

  async updateProjectEntry(
    id: string,
    updatedBy: string,
    fields: { hours?: number; description?: string; taskId?: string; resetReview?: boolean },
  ): Promise<ProjectTimeEntryRecord> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    const setClauses: string[] = ["updated_by = ?", "updated_at = ?"];
    const values: unknown[] = [updatedBy, now];

    if (fields.hours !== undefined) { setClauses.push("hours = ?"); values.push(fields.hours); }
    if (fields.description !== undefined) { setClauses.push("description = ?"); values.push(fields.description.trim()); }
    if (fields.taskId !== undefined) { setClauses.push("task_id = ?"); values.push(fields.taskId); }
    if (fields.resetReview) {
      setClauses.push("review_status = 'PENDING'");
      setClauses.push("reviewed_by = NULL");
      setClauses.push("reviewed_at = NULL");
      setClauses.push("rejection_reason = NULL");
    }

    values.push(id);
    await this.pool.query(
      `UPDATE project_time_entries SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    return (await this.getProjectEntryById(id))!;
  }

  async deleteProjectEntry(id: string): Promise<void> {
    await this.pool.query("DELETE FROM project_time_entries WHERE id = ?", [id]);
  }

  async listPendingProjectEntriesByManagedProjects(
    managerProjectIds: string[],
  ): Promise<ProjectTimeEntryRecord[]> {
    if (managerProjectIds.length === 0) return [];
    const placeholders = managerProjectIds.map(() => "?").join(", ");
    const [rows] = await this.pool.query<DbProjectTimeEntryRow[]>(
      `SELECT
         te.*,
         p.name AS project_name,
         t.name AS task_name,
         u.name AS user_name
       FROM project_time_entries te
       LEFT JOIN projects p ON p.id = te.project_id
       LEFT JOIN project_tasks t ON t.id = te.task_id
       LEFT JOIN users u ON u.id = te.user_id
       WHERE te.project_id IN (${placeholders}) AND te.review_status = 'PENDING'
       ORDER BY te.created_at ASC`,
      managerProjectIds,
    );
    return rows.map(mapProjectEntry);
  }

  async approveProjectEntry(id: string, reviewedBy: string): Promise<ProjectTimeEntryRecord> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `UPDATE project_time_entries
       SET review_status = 'APPROVED', reviewed_by = ?, reviewed_at = ?, rejection_reason = NULL, updated_by = ?, updated_at = ?
       WHERE id = ?`,
      [reviewedBy, now, reviewedBy, now, id],
    );
    return (await this.getProjectEntryById(id))!;
  }

  async rejectProjectEntry(
    id: string,
    reviewedBy: string,
    reason: string,
  ): Promise<ProjectTimeEntryRecord> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `UPDATE project_time_entries
       SET review_status = 'REJECTED', reviewed_by = ?, reviewed_at = ?, rejection_reason = ?, updated_by = ?, updated_at = ?
       WHERE id = ?`,
      [reviewedBy, now, reason.trim(), reviewedBy, now, id],
    );
    return (await this.getProjectEntryById(id))!;
  }

  /** Total de horas imputadas en un proyecto y tarea por un usuario en una fecha */
  async sumProjectHoursForUserOnDate(userId: string, date: string): Promise<number> {
    const [rows] = await this.pool.query<[{ total: string | number }]>(
      `SELECT COALESCE(SUM(hours), 0) AS total
       FROM project_time_entries
       WHERE user_id = ? AND date = ?`,
      [userId, date],
    );
    return Number((rows as unknown as { total: string | number }[])[0]?.total ?? 0);
  }

  async sumHoursForUserOnDatePerProject(userId: string, projectId: string, date: string): Promise<number> {
    const [rows] = await this.pool.query<[{ total: string | number }]>(
      `SELECT COALESCE(SUM(hours), 0) AS total
       FROM project_time_entries
       WHERE user_id = ? AND project_id = ? AND date = ?`,
      [userId, projectId, date],
    );
    return Number((rows as unknown as { total: string | number }[])[0]?.total ?? 0);
  }

  // ── Internal time entries ─────────────────────────────────────────────────

  async listInternalEntries(filters: InternalTimeEntryFilters): Promise<InternalTimeEntryRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.userId) { conditions.push("user_id = ?"); values.push(filters.userId); }
    if (filters.category) { conditions.push("category = ?"); values.push(filters.category); }
    if (filters.dateFrom) { conditions.push("date >= ?"); values.push(filters.dateFrom); }
    if (filters.dateTo) { conditions.push("date <= ?"); values.push(filters.dateTo); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await this.pool.query<DbInternalTimeEntryRow[]>(
      `SELECT * FROM internal_time_entries ${where} ORDER BY date DESC, created_at DESC`,
      values,
    );
    return rows.map(mapInternalEntry);
  }

  async getInternalEntryById(id: string): Promise<InternalTimeEntryRecord | null> {
    const [rows] = await this.pool.query<DbInternalTimeEntryRow[]>(
      "SELECT * FROM internal_time_entries WHERE id = ?",
      [id],
    );
    return rows[0] ? mapInternalEntry(rows[0]) : null;
  }

  async createInternalEntry(
    category: InternalCategory,
    userId: string,
    date: string,
    hours: number,
    description: string,
    createdBy: string,
  ): Promise<InternalTimeEntryRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT INTO internal_time_entries
         (id, category, user_id, date, hours, description, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [id, category, userId, date, hours, description.trim(), createdBy, now, now],
    );
    return (await this.getInternalEntryById(id))!;
  }

  async updateInternalEntry(
    id: string,
    updatedBy: string,
    fields: { hours?: number; description?: string },
  ): Promise<InternalTimeEntryRecord> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    const setClauses: string[] = ["updated_by = ?", "updated_at = ?"];
    const values: unknown[] = [updatedBy, now];

    if (fields.hours !== undefined) { setClauses.push("hours = ?"); values.push(fields.hours); }
    if (fields.description !== undefined) { setClauses.push("description = ?"); values.push(fields.description.trim()); }

    values.push(id);
    await this.pool.query(
      `UPDATE internal_time_entries SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    return (await this.getInternalEntryById(id))!;
  }

  async deleteInternalEntry(id: string): Promise<void> {
    await this.pool.query("DELETE FROM internal_time_entries WHERE id = ?", [id]);
  }

  async sumInternalHoursForUserOnDate(userId: string, date: string): Promise<number> {
    const [rows] = await this.pool.query<[{ total: string | number }]>(
      `SELECT COALESCE(SUM(hours), 0) AS total
       FROM internal_time_entries
       WHERE user_id = ? AND date = ?`,
      [userId, date],
    );
    return Number((rows as unknown as { total: string | number }[])[0]?.total ?? 0);
  }
}

export const createTimeEntriesRepository = () => new TimeEntriesRepository();

import { getMySqlPool } from "../../../core/db/mysql";
import type {
  CaffTimeEntryFilters,
  CaffTimeEntryRecord,
  CaffSection,
} from "../domain/types";

interface DbCaffTimeEntryRow {
  id: string;
  user_id: string;
  section: CaffSection;
  date: string;
  hours: string | number;
  description: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

const mapEntry = (row: DbCaffTimeEntryRow): CaffTimeEntryRecord => ({
  id: row.id,
  userId: row.user_id,
  section: row.section,
  date: row.date,
  hours: Number(row.hours),
  description: row.description,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class CaffHoursRepository {
  private get pool() {
    return getMySqlPool();
  }

  async list(filters: CaffTimeEntryFilters): Promise<CaffTimeEntryRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.userId) {
      conditions.push("user_id = ?");
      values.push(filters.userId);
    }
    if (filters.section) {
      conditions.push("section = ?");
      values.push(filters.section);
    }
    if (filters.dateFrom) {
      conditions.push("date >= ?");
      values.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push("date <= ?");
      values.push(filters.dateTo);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await this.pool.query<DbCaffTimeEntryRow[]>(
      `SELECT * FROM caff_time_entries ${where} ORDER BY date DESC, created_at DESC`,
      values,
    );
    return rows.map(mapEntry);
  }

  async getById(id: string): Promise<CaffTimeEntryRecord | null> {
    const [rows] = await this.pool.query<DbCaffTimeEntryRow[]>(
      "SELECT * FROM caff_time_entries WHERE id = ?",
      [id],
    );
    return rows[0] ? mapEntry(rows[0]) : null;
  }

  async create(input: {
    userId: string;
    section: CaffSection;
    date: string;
    hours: number;
    description: string;
    createdBy: string;
  }): Promise<CaffTimeEntryRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT INTO caff_time_entries
         (id, user_id, section, date, hours, description, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [id, input.userId, input.section, input.date, input.hours, input.description.trim(), input.createdBy, now, now],
    );
    return (await this.getById(id))!;
  }

  async update(id: string, updatedBy: string, fields: {
    section?: CaffSection;
    date?: string;
    hours?: number;
    description?: string;
  }): Promise<CaffTimeEntryRecord> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    const setClauses: string[] = ["updated_by = ?", "updated_at = ?"];
    const values: unknown[] = [updatedBy, now];

    if (fields.section !== undefined) {
      setClauses.push("section = ?");
      values.push(fields.section);
    }
    if (fields.date !== undefined) {
      setClauses.push("date = ?");
      values.push(fields.date);
    }
    if (fields.hours !== undefined) {
      setClauses.push("hours = ?");
      values.push(fields.hours);
    }
    if (fields.description !== undefined) {
      setClauses.push("description = ?");
      values.push(fields.description.trim());
    }

    values.push(id);
    await this.pool.query(
      `UPDATE caff_time_entries SET ${setClauses.join(", ")} WHERE id = ?`,
      values,
    );
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    await this.pool.query("DELETE FROM caff_time_entries WHERE id = ?", [id]);
  }
}

export const createCaffHoursRepository = () => new CaffHoursRepository();

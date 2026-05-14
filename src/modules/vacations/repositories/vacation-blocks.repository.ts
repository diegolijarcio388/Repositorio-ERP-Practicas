import { getMySqlPool } from "../../../core/db/mysql";
import { normalizeDays } from "../services/date-helpers";
import type { VacationBlockRecord } from "../domain/types";

interface DbVacationBlockRow {
  id: string;
  department_id: string;
  days_json: string | null;
  start_date: string | null;
  end_date: string | null;
  reason: string | null;
  created_by: string;
  created_at: string;
}

const mapRow = (row: DbVacationBlockRow): VacationBlockRecord => ({
  id: row.id,
  departmentId: row.department_id,
  days: row.days_json ? (JSON.parse(row.days_json) as string[]) : null,
  startDate: row.start_date,
  endDate: row.end_date,
  reason: row.reason,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

export class VacationBlocksRepository {
  async listByDepartment(departmentId: string): Promise<VacationBlockRecord[]> {
    const [rows] = await getMySqlPool().query<DbVacationBlockRow[]>(
      `SELECT id, department_id, days_json, start_date, end_date, reason, created_by, created_at
       FROM vacation_blocks WHERE department_id = ? ORDER BY created_at DESC`,
      [departmentId],
    );
    return rows.map(mapRow);
  }

  async create(input: {
    departmentId: string;
    days?: string[];
    startDate?: string;
    endDate?: string;
    reason?: string;
    createdBy: string;
  }): Promise<VacationBlockRecord> {
    const id = `vblock-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const days = input.days?.length ? normalizeDays(input.days) : null;
    await getMySqlPool().query(
      `INSERT INTO vacation_blocks (id, department_id, days_json, start_date, end_date, reason, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.departmentId,
        days ? JSON.stringify(days) : null,
        input.startDate ?? null,
        input.endDate ?? null,
        input.reason ?? null,
        input.createdBy,
        now,
      ],
    );
    const [rows] = await getMySqlPool().query<DbVacationBlockRow[]>(
      `SELECT id, department_id, days_json, start_date, end_date, reason, created_by, created_at
       FROM vacation_blocks WHERE id = ? LIMIT 1`,
      [id],
    );
    return mapRow(rows[0]);
  }

  async deleteById(id: string): Promise<void> {
    await getMySqlPool().query("DELETE FROM vacation_blocks WHERE id = ?", [id]);
  }
}

export const createVacationBlocksRepository = () =>
  new VacationBlocksRepository();

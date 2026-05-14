import { getMySqlPool } from "../../../core/db/mysql";
import { forceBlocksSelectionForHoliday } from "../domain/policies";
import {
  expandDateRangeToDays,
  normalizeDays,
} from "../../vacations/services/date-helpers";
import type {
  CalendarEventRecord,
  CalendarEventScope,
  CalendarEventType,
} from "../../vacations/domain/types";

interface DbCalendarEventRow {
  id: string;
  title: string;
  description: string | null;
  type: CalendarEventType;
  scope: CalendarEventScope;
  department_id: string | null;
  days_json: string | null;
  start_date: string | null;
  end_date: string | null;
  all_day: number;
  blocks_selection: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: DbCalendarEventRow): CalendarEventRecord => ({
  id: row.id,
  title: row.title,
  description: row.description,
  type: row.type,
  scope: row.scope,
  departmentId: row.department_id,
  days: row.days_json ? (JSON.parse(row.days_json) as string[]) : null,
  startDate: row.start_date,
  endDate: row.end_date,
  allDay: Boolean(row.all_day),
  blocksSelection: Boolean(row.blocks_selection),
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface UpsertCalendarEventInput {
  id?: string;
  title: string;
  description?: string | null;
  type: CalendarEventType;
  scope: CalendarEventScope;
  departmentId?: string | null;
  days?: string[] | null;
  startDate?: string | null;
  endDate?: string | null;
  allDay?: boolean;
  blocksSelection?: boolean;
  createdBy: string;
}

export class CalendarEventsRepository {
  async listFiltered(input: {
    dateFrom?: string;
    dateTo?: string;
    departmentId?: string;
    type?: CalendarEventType;
  }): Promise<CalendarEventRecord[]> {
    const query = `
      SELECT id, title, description, type, scope, department_id, days_json, start_date, end_date,
             all_day, blocks_selection, created_by, created_at, updated_at
      FROM calendar_events
      WHERE (
        ? IS NULL OR scope = 'GLOBAL' OR department_id = ?
      )
      ORDER BY created_at DESC
    `;
    const [rows] = await getMySqlPool().query<DbCalendarEventRow[]>(query, [
      input.departmentId ?? null,
      input.departmentId ?? null,
    ]);
    const mapped = rows.map(mapRow);
    return mapped.filter((event) => {
      if (input.type && event.type !== input.type) return false;
      const days = this.expandEventDays(event);
      if (days.length === 0) return true;
      if (input.dateFrom && days[days.length - 1] < input.dateFrom) return false;
      if (input.dateTo && days[0] > input.dateTo) return false;
      return true;
    });
  }

  async getById(id: string): Promise<CalendarEventRecord | null> {
    const [rows] = await getMySqlPool().query<DbCalendarEventRow[]>(
      `SELECT id, title, description, type, scope, department_id, days_json, start_date, end_date,
              all_day, blocks_selection, created_by, created_at, updated_at
       FROM calendar_events WHERE id = ? LIMIT 1`,
      [id],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  }

  async upsert(input: UpsertCalendarEventInput): Promise<CalendarEventRecord> {
    const forcedBlocksSelection = forceBlocksSelectionForHoliday(
      input.type,
      Boolean(input.blocksSelection),
    );
    const normalizedDays = input.days?.length ? normalizeDays(input.days) : null;
    const now = new Date().toISOString();

    if (!input.id) {
      const createdId = `cal-${crypto.randomUUID()}`;
      await getMySqlPool().query(
        `INSERT INTO calendar_events (
          id, title, description, type, scope, department_id, days_json, start_date, end_date,
          all_day, blocks_selection, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          createdId,
          input.title,
          input.description ?? null,
          input.type,
          input.scope,
          input.scope === "DEPARTMENT" ? input.departmentId ?? null : null,
          normalizedDays ? JSON.stringify(normalizedDays) : null,
          input.startDate ?? null,
          input.endDate ?? null,
          input.allDay === false ? 0 : 1,
          forcedBlocksSelection ? 1 : 0,
          input.createdBy,
          now,
          now,
        ],
      );
      const created = await this.getById(createdId);
      if (!created) throw new Error("No se pudo crear calendar event.");
      return created;
    }

    await getMySqlPool().query(
      `UPDATE calendar_events
       SET title = ?, description = ?, type = ?, scope = ?, department_id = ?, days_json = ?,
           start_date = ?, end_date = ?, all_day = ?, blocks_selection = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.title,
        input.description ?? null,
        input.type,
        input.scope,
        input.scope === "DEPARTMENT" ? input.departmentId ?? null : null,
        normalizedDays ? JSON.stringify(normalizedDays) : null,
        input.startDate ?? null,
        input.endDate ?? null,
        input.allDay === false ? 0 : 1,
        forcedBlocksSelection ? 1 : 0,
        now,
        input.id,
      ],
    );
    const updated = await this.getById(input.id);
    if (!updated) throw new Error("No se pudo actualizar calendar event.");
    return updated;
  }

  async deleteById(id: string): Promise<void> {
    await getMySqlPool().query("DELETE FROM calendar_events WHERE id = ?", [id]);
  }

  expandEventDays(event: CalendarEventRecord): string[] {
    if (event.days?.length) return normalizeDays(event.days);
    if (event.startDate && event.endDate) {
      return expandDateRangeToDays(event.startDate, event.endDate);
    }
    return [];
  }
}

export const createCalendarEventsRepository = () =>
  new CalendarEventsRepository();

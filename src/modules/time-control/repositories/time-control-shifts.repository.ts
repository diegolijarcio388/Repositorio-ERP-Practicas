import { getMySqlPool } from "../../../core/db/mysql";
import type {
  TimeControlShift,
  TimeControlShiftSegment,
} from "../domain/types";

export interface TimeControlShiftsRepository {
  findAssignedByUserId(userId: string): Promise<TimeControlShift | null>;
  listActive(): Promise<TimeControlShift[]>;
}

interface DbShiftRow {
  shift_id: string | null;
  shift_name: string | null;
  shift_description: string | null;
  shift_is_active: number | null;
  shift_allows_overnight: number | null;
  shift_created_at: string | null;
  shift_updated_at: string | null;
  segment_id: string | null;
  segment_order: number | null;
  segment_start_time: string | null;
  segment_end_time: string | null;
  segment_tolerance_start_minutes: number | null;
  segment_tolerance_end_minutes: number | null;
  segment_created_at: string | null;
  segment_updated_at: string | null;
}

const mapShift = (rows: DbShiftRow[]): TimeControlShift | null => {
  const baseRow = rows.find((row) => row.shift_id);
  if (!baseRow?.shift_id || !baseRow.shift_name) {
    return null;
  }

  const segments: TimeControlShiftSegment[] = rows
    .filter((row) => row.segment_id)
    .map((row) => ({
      id: row.segment_id!,
      shiftId: row.shift_id!,
      segmentOrder: Number(row.segment_order ?? 0),
      startTime: row.segment_start_time!,
      endTime: row.segment_end_time!,
      toleranceStartMinutes: Number(row.segment_tolerance_start_minutes ?? 0),
      toleranceEndMinutes: Number(row.segment_tolerance_end_minutes ?? 0),
      createdAt: row.segment_created_at!,
      updatedAt: row.segment_updated_at!,
    }))
    .sort((left, right) => left.segmentOrder - right.segmentOrder);

  return {
    id: baseRow.shift_id,
    name: baseRow.shift_name,
    description: baseRow.shift_description,
    isActive: Boolean(baseRow.shift_is_active),
    allowsOvernight: Boolean(baseRow.shift_allows_overnight),
    createdAt: baseRow.shift_created_at!,
    updatedAt: baseRow.shift_updated_at!,
    segments,
  };
};

class MySqlTimeControlShiftsRepository implements TimeControlShiftsRepository {
  async findAssignedByUserId(userId: string): Promise<TimeControlShift | null> {
    const [rows] = await getMySqlPool().query<DbShiftRow[]>(
      `SELECT
          s.id AS shift_id,
          s.name AS shift_name,
          s.description AS shift_description,
          s.is_active AS shift_is_active,
          s.allows_overnight AS shift_allows_overnight,
          s.created_at AS shift_created_at,
          s.updated_at AS shift_updated_at,
          seg.id AS segment_id,
          seg.segment_order,
          seg.start_time AS segment_start_time,
          seg.end_time AS segment_end_time,
          seg.tolerance_start_minutes AS segment_tolerance_start_minutes,
          seg.tolerance_end_minutes AS segment_tolerance_end_minutes,
          seg.created_at AS segment_created_at,
          seg.updated_at AS segment_updated_at
       FROM users u
       LEFT JOIN time_control_shifts s
         ON s.id = u.time_control_shift_id
       LEFT JOIN time_control_shift_segments seg
         ON seg.shift_id = s.id
       WHERE u.id = ?
       ORDER BY seg.segment_order ASC`,
      [userId],
    );

    return mapShift(rows);
  }

  async listActive(): Promise<TimeControlShift[]> {
    const [rows] = await getMySqlPool().query<DbShiftRow[]>(
      `SELECT
          s.id AS shift_id,
          s.name AS shift_name,
          s.description AS shift_description,
          s.is_active AS shift_is_active,
          s.allows_overnight AS shift_allows_overnight,
          s.created_at AS shift_created_at,
          s.updated_at AS shift_updated_at,
          seg.id AS segment_id,
          seg.segment_order,
          seg.start_time AS segment_start_time,
          seg.end_time AS segment_end_time,
          seg.tolerance_start_minutes AS segment_tolerance_start_minutes,
          seg.tolerance_end_minutes AS segment_tolerance_end_minutes,
          seg.created_at AS segment_created_at,
          seg.updated_at AS segment_updated_at
       FROM time_control_shifts s
       LEFT JOIN time_control_shift_segments seg
         ON seg.shift_id = s.id
       WHERE s.is_active = 1
       ORDER BY s.name ASC, seg.segment_order ASC`,
    );

    const rowsByShiftId = new Map<string, DbShiftRow[]>();
    for (const row of rows) {
      if (!row.shift_id) {
        continue;
      }
      const currentRows = rowsByShiftId.get(row.shift_id) ?? [];
      currentRows.push(row);
      rowsByShiftId.set(row.shift_id, currentRows);
    }

    return Array.from(rowsByShiftId.values())
      .map(mapShift)
      .filter((shift): shift is TimeControlShift => Boolean(shift));
  }
}

export const createTimeControlShiftsRepository =
  (): TimeControlShiftsRepository => new MySqlTimeControlShiftsRepository();

import { getMySqlPool } from "../../../core/db/mysql";
import type {
  VacationEventHistoryRecord,
  VacationRequestStatus,
} from "../domain/types";

interface DbVacationHistoryRow {
  id: string;
  request_id: string;
  from_status: VacationRequestStatus | null;
  to_status: VacationRequestStatus;
  changed_by: string;
  comment: string | null;
  created_at: string;
}

const mapRow = (row: DbVacationHistoryRow): VacationEventHistoryRecord => ({
  id: row.id,
  requestId: row.request_id,
  fromStatus: row.from_status,
  toStatus: row.to_status,
  changedBy: row.changed_by,
  comment: row.comment,
  createdAt: row.created_at,
});

export class VacationHistoryRepository {
  async add(input: {
    requestId: string;
    fromStatus: VacationRequestStatus | null;
    toStatus: VacationRequestStatus;
    changedBy: string;
    comment?: string;
  }): Promise<VacationEventHistoryRecord> {
    const id = `vhist-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await getMySqlPool().query(
      `INSERT INTO vacation_events_history (id, request_id, from_status, to_status, changed_by, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.requestId,
        input.fromStatus,
        input.toStatus,
        input.changedBy,
        input.comment ?? null,
        now,
      ],
    );
    const [rows] = await getMySqlPool().query<DbVacationHistoryRow[]>(
      `SELECT id, request_id, from_status, to_status, changed_by, comment, created_at
       FROM vacation_events_history WHERE id = ? LIMIT 1`,
      [id],
    );
    return mapRow(rows[0]);
  }

  async deleteByRequestId(requestId: string): Promise<void> {
    await getMySqlPool().query(
      "DELETE FROM vacation_events_history WHERE request_id = ?",
      [requestId],
    );
  }
}

export const createVacationHistoryRepository = () => new VacationHistoryRepository();

import { getMySqlPool } from "../../../core/db/mysql";
import type { NotificationRecord } from "../../vacations/domain/types";

interface DbNotificationRow {
  id: string;
  to_user_id: string;
  type: string;
  payload_json: string;
  read_at: string | null;
  created_at: string;
}

const mapRow = (row: DbNotificationRow): NotificationRecord => ({
  id: row.id,
  toUserId: row.to_user_id,
  type: row.type,
  payload: JSON.parse(row.payload_json) as Record<string, unknown>,
  readAt: row.read_at,
  createdAt: row.created_at,
});

export class NotificationsRepository {
  async create(input: {
    toUserId: string;
    type: string;
    payload: Record<string, unknown>;
  }): Promise<NotificationRecord> {
    const id = `noti-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await getMySqlPool().query(
      `INSERT INTO notifications (id, to_user_id, type, payload_json, read_at, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
      [id, input.toUserId, input.type, JSON.stringify(input.payload), now],
    );
    const [rows] = await getMySqlPool().query<DbNotificationRow[]>(
      `SELECT id, to_user_id, type, payload_json, read_at, created_at
       FROM notifications WHERE id = ? LIMIT 1`,
      [id],
    );
    return mapRow(rows[0]);
  }

  async listForUser(userId: string): Promise<NotificationRecord[]> {
    const [rows] = await getMySqlPool().query<DbNotificationRow[]>(
      `SELECT id, to_user_id, type, payload_json, read_at, created_at
       FROM notifications WHERE to_user_id = ? ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(mapRow);
  }
}

export const createNotificationsRepository = () => new NotificationsRepository();

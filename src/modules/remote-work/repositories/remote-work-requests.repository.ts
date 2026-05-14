import { getMySqlPool } from "../../../core/db/mysql";
import type {
  CreateRemoteWorkRequestInput,
  RemoteWorkRequestFilters,
  RemoteWorkRequestRecord,
} from "../domain/types";

interface DbRemoteWorkRequestRow {
  id: string;
  user_id: string;
  department_id: string;
  remote_work_date: string;
  reason: string;
  status: RemoteWorkRequestRecord["status"];
  approver_id: string | null;
  approver_comment: string | null;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: DbRemoteWorkRequestRow): RemoteWorkRequestRecord => ({
  id: row.id,
  userId: row.user_id,
  departmentId: row.department_id,
  remoteWorkDate: row.remote_work_date,
  reason: row.reason,
  status: row.status,
  approverId: row.approver_id,
  approverComment: row.approver_comment,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface RemoteWorkRequestsRepository {
  create(
    input: CreateRemoteWorkRequestInput,
  ): Promise<RemoteWorkRequestRecord>;
  listFiltered(
    filters: RemoteWorkRequestFilters,
  ): Promise<RemoteWorkRequestRecord[]>;
  getById(id: string): Promise<RemoteWorkRequestRecord | null>;
  updateStatus(input: {
    id: string;
    status: RemoteWorkRequestRecord["status"];
    approverId: string | null;
    approverComment: string | null;
    updatedAt: string;
  }): Promise<RemoteWorkRequestRecord | null>;
}

class MySqlRemoteWorkRequestsRepository
  implements RemoteWorkRequestsRepository
{
  async create(
    input: CreateRemoteWorkRequestInput,
  ): Promise<RemoteWorkRequestRecord> {
    await getMySqlPool().query(
      `INSERT INTO remote_work_requests (
        id, user_id, department_id, remote_work_date, reason,
        status, approver_id, approver_comment, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.userId,
        input.departmentId,
        input.remoteWorkDate,
        input.reason,
        input.status,
        input.approverId ?? null,
        input.approverComment ?? null,
        input.createdAt,
        input.updatedAt,
      ],
    );

    const created = await this.listFiltered({
      userId: input.userId,
      dateFrom: input.remoteWorkDate,
      dateTo: input.remoteWorkDate,
    });
    const matched = created.find((entry) => entry.id === input.id);
    if (!matched) {
      throw new Error("No se pudo crear el teletrabajo.");
    }

    return matched;
  }

  async listFiltered(
    filters: RemoteWorkRequestFilters,
  ): Promise<RemoteWorkRequestRecord[]> {
    let sql =
      "SELECT id, user_id, department_id, remote_work_date, reason, status, approver_id, approver_comment, created_at, updated_at FROM remote_work_requests WHERE 1=1";
    const args: Array<string> = [];

    if (filters.userId) {
      sql += " AND user_id = ?";
      args.push(filters.userId);
    }

    if (filters.userIds?.length) {
      const marks = filters.userIds.map(() => "?").join(", ");
      sql += ` AND user_id IN (${marks})`;
      args.push(...filters.userIds);
    }

    if (filters.status) {
      sql += " AND status = ?";
      args.push(filters.status);
    }

    if (filters.dateFrom) {
      sql += " AND remote_work_date >= ?";
      args.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      sql += " AND remote_work_date <= ?";
      args.push(filters.dateTo);
    }

    sql += " ORDER BY remote_work_date DESC, created_at DESC";

    const [rows] = await getMySqlPool().query<DbRemoteWorkRequestRow[]>(sql, args);
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<RemoteWorkRequestRecord | null> {
    const [rows] = await getMySqlPool().query<DbRemoteWorkRequestRow[]>(
      "SELECT id, user_id, department_id, remote_work_date, reason, status, approver_id, approver_comment, created_at, updated_at FROM remote_work_requests WHERE id = ? LIMIT 1",
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async updateStatus(input: {
    id: string;
    status: RemoteWorkRequestRecord["status"];
    approverId: string | null;
    approverComment: string | null;
    updatedAt: string;
  }): Promise<RemoteWorkRequestRecord | null> {
    await getMySqlPool().query(
      `UPDATE remote_work_requests
       SET status = ?, approver_id = ?, approver_comment = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.status,
        input.approverId,
        input.approverComment,
        input.updatedAt,
        input.id,
      ],
    );
    return this.getById(input.id);
  }
}

export const createRemoteWorkRequestsRepository =
  (): RemoteWorkRequestsRepository => new MySqlRemoteWorkRequestsRepository();

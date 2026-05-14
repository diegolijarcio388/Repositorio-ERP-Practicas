import { getMySqlPool } from "../../../core/db/mysql";
import type {
  CreatePermissionRequestInput,
  PermissionRequestFilters,
  PermissionRequestRecord,
} from "../domain/types";

interface DbPermissionRequestRow {
  id: string;
  user_id: string;
  department_id: string;
  permission_date: string;
  permission_type: PermissionRequestRecord["permissionType"];
  reason: string;
  status: PermissionRequestRecord["status"];
  approver_id: string | null;
  approver_comment: string | null;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: DbPermissionRequestRow): PermissionRequestRecord => ({
  id: row.id,
  userId: row.user_id,
  departmentId: row.department_id,
  permissionDate: row.permission_date,
  permissionType: row.permission_type,
  reason: row.reason,
  status: row.status,
  approverId: row.approver_id,
  approverComment: row.approver_comment,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface PermissionRequestsRepository {
  create(
    input: CreatePermissionRequestInput,
  ): Promise<PermissionRequestRecord>;
  listFiltered(
    filters: PermissionRequestFilters,
  ): Promise<PermissionRequestRecord[]>;
  getById(id: string): Promise<PermissionRequestRecord | null>;
  updateStatus(input: {
    id: string;
    status: PermissionRequestRecord["status"];
    approverId: string | null;
    approverComment: string | null;
    updatedAt: string;
  }): Promise<PermissionRequestRecord | null>;
}

class MySqlPermissionRequestsRepository
  implements PermissionRequestsRepository
{
  async create(
    input: CreatePermissionRequestInput,
  ): Promise<PermissionRequestRecord> {
    await getMySqlPool().query(
      `INSERT INTO permission_requests (
        id, user_id, department_id, permission_date, permission_type, reason,
        status, approver_id, approver_comment, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.userId,
        input.departmentId,
        input.permissionDate,
        input.permissionType,
        input.reason,
        input.status,
        input.approverId ?? null,
        input.approverComment ?? null,
        input.createdAt,
        input.updatedAt,
      ],
    );

    const created = await this.listFiltered({ userId: input.userId, dateFrom: input.permissionDate, dateTo: input.permissionDate });
    const matched = created.find((entry) => entry.id === input.id);
    if (!matched) {
      throw new Error("No se pudo crear el permiso.");
    }

    return matched;
  }

  async listFiltered(
    filters: PermissionRequestFilters,
  ): Promise<PermissionRequestRecord[]> {
    let sql =
      "SELECT id, user_id, department_id, permission_date, permission_type, reason, status, approver_id, approver_comment, created_at, updated_at FROM permission_requests WHERE 1=1";
    const args: Array<string> = [];

    if (filters.departmentId) {
      sql += " AND department_id = ?";
      args.push(filters.departmentId);
    }

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
      sql += " AND permission_date >= ?";
      args.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      sql += " AND permission_date <= ?";
      args.push(filters.dateTo);
    }

    sql += " ORDER BY permission_date DESC, created_at DESC";

    const [rows] = await getMySqlPool().query<DbPermissionRequestRow[]>(sql, args);
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<PermissionRequestRecord | null> {
    const [rows] = await getMySqlPool().query<DbPermissionRequestRow[]>(
      "SELECT id, user_id, department_id, permission_date, permission_type, reason, status, approver_id, approver_comment, created_at, updated_at FROM permission_requests WHERE id = ? LIMIT 1",
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async updateStatus(input: {
    id: string;
    status: PermissionRequestRecord["status"];
    approverId: string | null;
    approverComment: string | null;
    updatedAt: string;
  }): Promise<PermissionRequestRecord | null> {
    await getMySqlPool().query(
      `UPDATE permission_requests
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

export const createPermissionRequestsRepository =
  (): PermissionRequestsRepository => new MySqlPermissionRequestsRepository();

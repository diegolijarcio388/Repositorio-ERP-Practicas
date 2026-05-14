import { getMySqlPool } from "../../../core/db/mysql";
import type {
  VacationHourRange,
  VacationRequestFilters,
  VacationRequestRecord,
  VacationRequestStatus,
  VacationRequestType,
} from "../domain/types";

interface DbVacationRequestRow {
  id: string;
  user_id: string;
  department_id: string;
  request_title: string | null;
  days_json: string;
  request_type: VacationRequestType | null;
  hour_ranges_json: string | null;
  hours_total: string | number | null;
  uses_hour_bank: number | null;
  status: VacationRequestStatus;
  approver_id: string | null;
  approver_comment: string | null;
  proposed_days_json: string | null;
  proposed_hour_ranges_json: string | null;
  proposed_hours_total: string | number | null;
  change_request_comment: string | null;
  change_origin_status: "PENDING_ADMIN" | "APPROVED" | null;
  created_by_admin: number;
  fixed_by_department: number;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: DbVacationRequestRow): VacationRequestRecord => ({
  id: row.id,
  userId: row.user_id,
  departmentId: row.department_id,
  requestTitle: row.request_title,
  days: JSON.parse(row.days_json) as string[],
  requestType: row.request_type ?? "FULL_DAY",
  hourRanges: row.hour_ranges_json
    ? (JSON.parse(row.hour_ranges_json) as VacationHourRange[])
    : [],
  hoursTotal: Number(row.hours_total ?? 0),
  usesHourBank: Boolean(row.uses_hour_bank ?? 0),
  status: row.status,
  approverId: row.approver_id,
  approverComment: row.approver_comment,
  proposedDays: row.proposed_days_json ? (JSON.parse(row.proposed_days_json) as string[]) : null,
  proposedHourRanges: row.proposed_hour_ranges_json
    ? (JSON.parse(row.proposed_hour_ranges_json) as VacationHourRange[])
    : null,
  proposedHoursTotal: row.proposed_hours_total == null ? null : Number(row.proposed_hours_total),
  changeRequestComment: row.change_request_comment,
  changeOriginStatus: row.change_origin_status,
  createdByAdmin: Boolean(row.created_by_admin),
  fixedByDepartment: Boolean(row.fixed_by_department),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class VacationRequestsRepository {
  async create(input: {
    userId: string;
    departmentId: string;
    requestTitle?: string | null;
    days: string[];
    requestType: VacationRequestType;
    hourRanges?: VacationHourRange[];
    hoursTotal?: number;
    usesHourBank?: boolean;
    createdByAdmin?: boolean;
    fixedByDepartment?: boolean;
  }): Promise<VacationRequestRecord> {
    const id = `vreq-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await getMySqlPool().query(
      `INSERT INTO vacation_requests (
        id, user_id, department_id, request_title, days_json, request_type, hour_ranges_json, hours_total, uses_hour_bank,
        status, approver_id, approver_comment, proposed_days_json, proposed_hour_ranges_json, proposed_hours_total, change_request_comment, change_origin_status,
        created_by_admin, fixed_by_department, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?)`,
      [
        id,
        input.userId,
        input.departmentId,
        input.requestTitle ?? null,
        JSON.stringify(input.days),
        input.requestType,
        input.hourRanges?.length ? JSON.stringify(input.hourRanges) : null,
        input.hoursTotal ?? 0,
        input.usesHourBank ? 1 : 0,
        input.createdByAdmin ? 1 : 0,
        input.fixedByDepartment ? 1 : 0,
        now,
        now,
      ],
    );
    const created = await this.getById(id);
    if (!created) throw new Error("No se pudo crear solicitud.");
    return created;
  }

  async getById(id: string): Promise<VacationRequestRecord | null> {
    const [rows] = await getMySqlPool().query<DbVacationRequestRow[]>(
      `SELECT id, user_id, department_id, days_json, request_type, hour_ranges_json, hours_total, uses_hour_bank,
              request_title,
              status, approver_id, approver_comment, proposed_days_json, proposed_hour_ranges_json, proposed_hours_total, change_request_comment, change_origin_status,
              created_by_admin, fixed_by_department, created_at, updated_at
       FROM vacation_requests WHERE id = ? LIMIT 1`,
      [id],
    );
    const row = rows[0];
    return row ? mapRow(row) : null;
  }

  async listByUser(userId: string): Promise<VacationRequestRecord[]> {
    const [rows] = await getMySqlPool().query<DbVacationRequestRow[]>(
      `SELECT id, user_id, department_id, days_json, request_type, hour_ranges_json, hours_total, uses_hour_bank,
              request_title,
              status, approver_id, approver_comment, proposed_days_json, proposed_hour_ranges_json, proposed_hours_total, change_request_comment, change_origin_status,
              created_by_admin, fixed_by_department, created_at, updated_at
       FROM vacation_requests WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(mapRow);
  }

  async listFiltered(filters: VacationRequestFilters): Promise<VacationRequestRecord[]> {
    let sql =
      "SELECT id, user_id, department_id, request_title, days_json, request_type, hour_ranges_json, hours_total, uses_hour_bank, status, approver_id, approver_comment, proposed_days_json, proposed_hour_ranges_json, proposed_hours_total, change_request_comment, change_origin_status, created_by_admin, fixed_by_department, created_at, updated_at FROM vacation_requests WHERE 1=1";
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
    sql += " ORDER BY created_at DESC";
    const [rows] = await getMySqlPool().query<DbVacationRequestRow[]>(sql, args);
    const mapped = rows.map(mapRow);
    return mapped.filter((row) => {
      if (!filters.dateFrom && !filters.dateTo) return true;
      const sortedDays = [...row.days].sort((a, b) => a.localeCompare(b));
      const first = sortedDays[0];
      const last = sortedDays[sortedDays.length - 1];
      if (!first || !last) return true;
      if (filters.dateFrom && last < filters.dateFrom) return false;
      if (filters.dateTo && first > filters.dateTo) return false;
      return true;
    });
  }

  async updateStatus(input: {
    id: string;
    status: VacationRequestStatus;
    approverId: string;
    approverComment?: string;
  }): Promise<VacationRequestRecord> {
    const now = new Date().toISOString();
    await getMySqlPool().query(
      `UPDATE vacation_requests
       SET status = ?, approver_id = ?, approver_comment = ?, updated_at = ?
       WHERE id = ?`,
      [input.status, input.approverId, input.approverComment ?? null, now, input.id],
    );
    const updated = await this.getById(input.id);
    if (!updated) throw new Error("No se pudo actualizar solicitud.");
    return updated;
  }

  async updateRequestDays(input: {
    id: string;
    requestTitle?: string | null;
    days: string[];
    hoursTotal: number;
    hourRanges?: VacationHourRange[];
  }): Promise<VacationRequestRecord> {
    const now = new Date().toISOString();
    await getMySqlPool().query(
      `UPDATE vacation_requests
       SET request_title = ?, days_json = ?, hour_ranges_json = ?, hours_total = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.requestTitle ?? null,
        JSON.stringify(input.days),
        input.hourRanges?.length ? JSON.stringify(input.hourRanges) : null,
        input.hoursTotal,
        now,
        input.id,
      ],
    );
    const updated = await this.getById(input.id);
    if (!updated) throw new Error("No se pudo actualizar solicitud.");
    return updated;
  }

  async markChangeRequest(input: {
    id: string;
    proposedDays: string[];
    proposedHourRanges?: VacationHourRange[];
    proposedHoursTotal?: number;
    comment?: string;
    originStatus: "PENDING_ADMIN" | "APPROVED";
  }): Promise<VacationRequestRecord> {
    const now = new Date().toISOString();
    await getMySqlPool().query(
      `UPDATE vacation_requests
       SET status = 'CHANGE_PENDING_COORDINATOR',
           approver_id = NULL,
           approver_comment = NULL,
           proposed_days_json = ?,
           proposed_hour_ranges_json = ?,
           proposed_hours_total = ?,
           change_request_comment = ?,
           change_origin_status = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        JSON.stringify(input.proposedDays),
        input.proposedHourRanges?.length ? JSON.stringify(input.proposedHourRanges) : null,
        input.proposedHoursTotal ?? 0,
        input.comment ?? null,
        input.originStatus,
        now,
        input.id,
      ],
    );
    const updated = await this.getById(input.id);
    if (!updated) throw new Error("No se pudo crear solicitud de cambio.");
    return updated;
  }

  async clearChangeRequest(input: {
    id: string;
    status: VacationRequestStatus;
    approverId: string;
    approverComment?: string;
  }): Promise<VacationRequestRecord> {
    const now = new Date().toISOString();
    await getMySqlPool().query(
      `UPDATE vacation_requests
       SET status = ?,
           approver_id = ?,
           approver_comment = ?,
           proposed_days_json = NULL,
           proposed_hour_ranges_json = NULL,
           proposed_hours_total = NULL,
           change_request_comment = NULL,
           change_origin_status = NULL,
           updated_at = ?
       WHERE id = ?`,
      [input.status, input.approverId, input.approverComment ?? null, now, input.id],
    );
    const updated = await this.getById(input.id);
    if (!updated) throw new Error("No se pudo actualizar solicitud.");
    return updated;
  }

  async promoteChangeToAdmin(input: {
    id: string;
    approverId: string;
    approverComment?: string;
  }): Promise<VacationRequestRecord> {
    const now = new Date().toISOString();
    await getMySqlPool().query(
      `UPDATE vacation_requests
       SET status = 'CHANGE_PENDING_ADMIN',
           approver_id = ?,
           approver_comment = ?,
           updated_at = ?
       WHERE id = ?`,
      [input.approverId, input.approverComment ?? null, now, input.id],
    );
    const updated = await this.getById(input.id);
    if (!updated) throw new Error("No se pudo actualizar solicitud.");
    return updated;
  }

  async applyApprovedChange(input: {
    id: string;
    days: string[];
    hourRanges?: VacationHourRange[];
    hoursTotal: number;
    approverId: string;
    approverComment?: string;
  }): Promise<VacationRequestRecord> {
    const now = new Date().toISOString();
    await getMySqlPool().query(
      `UPDATE vacation_requests
       SET status = 'APPROVED',
           days_json = ?,
           hour_ranges_json = ?,
           hours_total = ?,
           approver_id = ?,
           approver_comment = ?,
           proposed_days_json = NULL,
           proposed_hour_ranges_json = NULL,
           proposed_hours_total = NULL,
           change_request_comment = NULL,
           change_origin_status = NULL,
           updated_at = ?
       WHERE id = ?`,
      [
        JSON.stringify(input.days),
        input.hourRanges?.length ? JSON.stringify(input.hourRanges) : null,
        input.hoursTotal,
        input.approverId,
        input.approverComment ?? null,
        now,
        input.id,
      ],
    );
    const updated = await this.getById(input.id);
    if (!updated) throw new Error("No se pudo aplicar la modificacion.");
    return updated;
  }

  async deleteById(id: string): Promise<void> {
    await getMySqlPool().query("DELETE FROM vacation_requests WHERE id = ?", [id]);
  }
}

export const createVacationRequestsRepository = () =>
  new VacationRequestsRepository();

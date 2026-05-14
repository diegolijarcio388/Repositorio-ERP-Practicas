import { getMySqlPool } from "../../../core/db/mysql";
import type {
  CreateWorkdayAdjustmentRequestInput,
  ReviewWorkdayAdjustmentRequestInput,
  WorkdayAdjustmentRequest,
  WorkdayAdjustmentRequestFilters,
} from "../domain/types";

export interface WorkdayAdjustmentRequestsRepository {
  createRequest(
    input: CreateWorkdayAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest>;

  findById(id: string): Promise<WorkdayAdjustmentRequest | null>;

  listFiltered(
    filters: WorkdayAdjustmentRequestFilters,
  ): Promise<WorkdayAdjustmentRequest[]>;

  updateReview(
    input: ReviewWorkdayAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest>;
}

interface DbWorkdayAdjustmentRequestRow {
  id: string;
  user_id: string;
  request_date: string;
  request_type: WorkdayAdjustmentRequest["requestType"];
  requested_time: string;
  requested_latitude: number | string | null;
  requested_longitude: number | string | null;
  reason: string;
  status: WorkdayAdjustmentRequest["status"];
  coordinator_comment: string | null;
  admin_comment: string | null;
  reviewed_by_coordinator_id: string | null;
  reviewed_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

const mapRow = (
  row: DbWorkdayAdjustmentRequestRow,
): WorkdayAdjustmentRequest => ({
  id: row.id,
  userId: row.user_id,
  requestDate: row.request_date,
  requestType: row.request_type,
  requestedTime: row.requested_time,
  requestedLatitude:
    row.requested_latitude === null ? null : Number(row.requested_latitude),
  requestedLongitude:
    row.requested_longitude === null ? null : Number(row.requested_longitude),
  reason: row.reason,
  status: row.status,
  coordinatorComment: row.coordinator_comment,
  adminComment: row.admin_comment,
  reviewedByCoordinatorId: row.reviewed_by_coordinator_id,
  reviewedByAdminId: row.reviewed_by_admin_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class MySqlWorkdayAdjustmentRequestsRepository
  implements WorkdayAdjustmentRequestsRepository
{
  async createRequest(
    input: CreateWorkdayAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest> {
    await getMySqlPool().query(
      `INSERT INTO workday_adjustment_requests (
        id, user_id, request_date, request_type, requested_time,
        requested_latitude, requested_longitude, reason, status,
        coordinator_comment, admin_comment,
        reviewed_by_coordinator_id, reviewed_by_admin_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.userId,
        input.requestDate,
        input.requestType,
        input.requestedTime,
        input.requestedLatitude,
        input.requestedLongitude,
        input.reason,
        input.status,
        input.coordinatorComment,
        input.adminComment,
        input.reviewedByCoordinatorId,
        input.reviewedByAdminId,
        input.createdAt,
        input.updatedAt,
      ],
    );

    const created = await this.findById(input.id);
    if (!created) {
      throw new Error("No se pudo crear la solicitud de fichaje.");
    }

    return created;
  }

  async findById(id: string): Promise<WorkdayAdjustmentRequest | null> {
    const [rows] = await getMySqlPool().query<DbWorkdayAdjustmentRequestRow[]>(
      `SELECT id, user_id, request_date, request_type, requested_time,
              requested_latitude, requested_longitude, reason, status,
              coordinator_comment, admin_comment,
              reviewed_by_coordinator_id, reviewed_by_admin_id,
              created_at, updated_at
       FROM workday_adjustment_requests
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async listFiltered(
    filters: WorkdayAdjustmentRequestFilters,
  ): Promise<WorkdayAdjustmentRequest[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.userId) {
      conditions.push(`user_id = ?`);
      values.push(filters.userId);
    }

    if (filters.userIds && filters.userIds.length > 0) {
      conditions.push(`user_id IN (?)`);
      values.push(filters.userIds);
    }

    if (filters.status) {
      conditions.push(`status = ?`);
      values.push(filters.status);
    }

    if (filters.statuses && filters.statuses.length > 0) {
      conditions.push(`status IN (?)`);
      values.push(filters.statuses);
    }

    let query = `SELECT id, user_id, request_date, request_type, requested_time,
                        requested_latitude, requested_longitude, reason, status,
                        coordinator_comment, admin_comment,
                        reviewed_by_coordinator_id, reviewed_by_admin_id,
                        created_at, updated_at
                 FROM workday_adjustment_requests`;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY request_date DESC, created_at DESC`;

    const [rows] = await getMySqlPool().query<DbWorkdayAdjustmentRequestRow[]>(
      query,
      values,
    );

    return rows.map(mapRow);
  }

  async updateReview(
    input: ReviewWorkdayAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest> {
    const setClauses: string[] = ["status = ?", "updated_at = ?"];
    const values: any[] = [input.status, input.updatedAt];

    if (input.coordinatorComment !== undefined) {
      setClauses.push("coordinator_comment = ?");
      values.push(input.coordinatorComment);
    }
    if (input.adminComment !== undefined) {
      setClauses.push("admin_comment = ?");
      values.push(input.adminComment);
    }
    if (input.reviewedByCoordinatorId !== undefined) {
      setClauses.push("reviewed_by_coordinator_id = ?");
      values.push(input.reviewedByCoordinatorId);
    }
    if (input.reviewedByAdminId !== undefined) {
      setClauses.push("reviewed_by_admin_id = ?");
      values.push(input.reviewedByAdminId);
    }

    values.push(input.requestId);

    await getMySqlPool().query(
      `UPDATE workday_adjustment_requests
       SET ${setClauses.join(", ")}
       WHERE id = ?`,
      values,
    );

    const updated = await this.findById(input.requestId);
    if (!updated) {
      throw new Error("No se pudo actualizar la revisión de la solicitud.");
    }

    return updated;
  }
}

export const createWorkdayAdjustmentRequestsRepository =
  (): WorkdayAdjustmentRequestsRepository =>
    new MySqlWorkdayAdjustmentRequestsRepository();

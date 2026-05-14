import { getMySqlPool } from "../../../core/db/mysql";
import type {
  CreateWorkdayIncidentJustificationInput,
  ReviewWorkdayIncidentJustificationInput,
  WorkdayIncidentJustification,
  WorkdayIncidentJustificationFilters,
} from "../domain/types";

interface DbWorkdayIncidentJustificationRow {
  id: string;
  record_id: string;
  user_id: string;
  reason: string;
  status: WorkdayIncidentJustification["status"];
  coordinator_comment: string | null;
  admin_comment: string | null;
  reviewed_by_coordinator_id: string | null;
  reviewed_by_admin_id: string | null;
  hidden_by_worker_at: string | null;
  created_at: string;
  updated_at: string;
}

const mapRow = (
  row: DbWorkdayIncidentJustificationRow,
): WorkdayIncidentJustification => ({
  id: row.id,
  recordId: row.record_id,
  userId: row.user_id,
  reason: row.reason,
  status: row.status,
  coordinatorComment: row.coordinator_comment,
  adminComment: row.admin_comment,
  reviewedByCoordinatorId: row.reviewed_by_coordinator_id,
  reviewedByAdminId: row.reviewed_by_admin_id,
  hiddenByWorkerAt: row.hidden_by_worker_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface WorkdayIncidentJustificationsRepository {
  create(
    input: CreateWorkdayIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification>;

  findById(id: string): Promise<WorkdayIncidentJustification | null>;

  findByRecordId(
    recordId: string,
  ): Promise<WorkdayIncidentJustification | null>;

  listFiltered(
    filters?: WorkdayIncidentJustificationFilters,
  ): Promise<WorkdayIncidentJustification[]>;

  updateReview(
    input: ReviewWorkdayIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification>;

  hideForWorker(id: string, hiddenAt: string): Promise<void>;
}

class MySqlWorkdayIncidentJustificationsRepository
  implements WorkdayIncidentJustificationsRepository
{
  async create(
    input: CreateWorkdayIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification> {
    await getMySqlPool().query(
      `INSERT INTO workday_incident_justifications (
        id, record_id, user_id, reason, status, coordinator_comment,
        admin_comment, reviewed_by_coordinator_id, reviewed_by_admin_id, hidden_by_worker_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.recordId,
        input.userId,
        input.reason,
        input.status,
        input.coordinatorComment,
        input.adminComment,
        input.reviewedByCoordinatorId,
        input.reviewedByAdminId,
        input.hiddenByWorkerAt,
        input.createdAt,
        input.updatedAt,
      ],
    );

    const created = await this.findById(input.id);
    if (!created) {
      throw new Error("No se pudo crear la justificación de incidencia.");
    }

    return created;
  }

  async findById(id: string): Promise<WorkdayIncidentJustification | null> {
    const [rows] = await getMySqlPool().query<
      DbWorkdayIncidentJustificationRow[]
    >(
      `SELECT id, record_id, user_id, reason, status, coordinator_comment,
              admin_comment, reviewed_by_coordinator_id, reviewed_by_admin_id, hidden_by_worker_at,
              created_at, updated_at
       FROM workday_incident_justifications
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByRecordId(
    recordId: string,
  ): Promise<WorkdayIncidentJustification | null> {
    const [rows] = await getMySqlPool().query<
      DbWorkdayIncidentJustificationRow[]
    >(
      `SELECT id, record_id, user_id, reason, status, coordinator_comment,
              admin_comment, reviewed_by_coordinator_id, reviewed_by_admin_id, hidden_by_worker_at,
              created_at, updated_at
       FROM workday_incident_justifications
       WHERE record_id = ?
       LIMIT 1`,
      [recordId],
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async listFiltered(
    filters: WorkdayIncidentJustificationFilters = {},
  ): Promise<WorkdayIncidentJustification[]> {
    const conditions = ["1=1"];
    const values: string[] = [];

    if (filters.userId) {
      conditions.push("user_id = ?");
      values.push(filters.userId);
    }

    if (filters.userIds?.length) {
      conditions.push(`user_id IN (${filters.userIds.map(() => "?").join(", ")})`);
      values.push(...filters.userIds);
    }

    if (filters.recordId) {
      conditions.push("record_id = ?");
      values.push(filters.recordId);
    }

    if (filters.recordIds?.length) {
      conditions.push(
        `record_id IN (${filters.recordIds.map(() => "?").join(", ")})`,
      );
      values.push(...filters.recordIds);
    }

    if (filters.status) {
      conditions.push("status = ?");
      values.push(filters.status);
    }

    if (filters.statuses?.length) {
      conditions.push(`status IN (${filters.statuses.map(() => "?").join(", ")})`);
      values.push(...filters.statuses);
    }

    if (filters.excludeHiddenByWorker) {
      conditions.push("hidden_by_worker_at IS NULL");
    }

    const [rows] = await getMySqlPool().query<
      DbWorkdayIncidentJustificationRow[]
    >(
      `SELECT id, record_id, user_id, reason, status, coordinator_comment,
              admin_comment, reviewed_by_coordinator_id, reviewed_by_admin_id, hidden_by_worker_at,
              created_at, updated_at
       FROM workday_incident_justifications
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC`,
      values,
    );

    return rows.map(mapRow);
  }

  async updateReview(
    input: ReviewWorkdayIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification> {
    await getMySqlPool().query(
      `UPDATE workday_incident_justifications
       SET status = ?,
           coordinator_comment = COALESCE(?, coordinator_comment),
           admin_comment = COALESCE(?, admin_comment),
           reviewed_by_coordinator_id = COALESCE(?, reviewed_by_coordinator_id),
           reviewed_by_admin_id = COALESCE(?, reviewed_by_admin_id),
           updated_at = ?
       WHERE id = ?`,
      [
        input.status,
        input.coordinatorComment ?? null,
        input.adminComment ?? null,
        input.reviewedByCoordinatorId ?? null,
        input.reviewedByAdminId ?? null,
        input.updatedAt,
        input.justificationId,
      ],
    );

    const updated = await this.findById(input.justificationId);
    if (!updated) {
      throw new Error("No se pudo actualizar la justificación de incidencia.");
    }

    return updated;
  }

  async hideForWorker(id: string, hiddenAt: string): Promise<void> {
    await getMySqlPool().query(
      `UPDATE workday_incident_justifications
       SET hidden_by_worker_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [hiddenAt, hiddenAt, id],
    );
  }
}

export const createWorkdayIncidentJustificationsRepository =
  (): WorkdayIncidentJustificationsRepository =>
    new MySqlWorkdayIncidentJustificationsRepository();

import { getMySqlPool } from "../../../core/db/mysql";
import type {
  AdminCloseWorkdayRecordInput,
  CloseCheckOutInput,
  CreateCheckInInput,
  IncidentFlag,
  ReviewWorkdayAdminValidationInput,
  WorkdayFilters,
  WorkdayDeviceType,
  WorkdayRecord,
} from "../domain/types";

export interface WorkdayRecordsRepository {
  createCheckIn(input: CreateCheckInInput): Promise<WorkdayRecord>;

  findById(id: string): Promise<WorkdayRecord | null>;

  listByIds(ids: string[]): Promise<WorkdayRecord[]>;

  findOpenByUserId(userId: string): Promise<WorkdayRecord | null>;

  findByUserIdAndDate(
    userId: string,
    workDate: string,
  ): Promise<WorkdayRecord | null>;

  closeCheckOut(input: CloseCheckOutInput): Promise<WorkdayRecord>;

  closeByAdmin(input: AdminCloseWorkdayRecordInput): Promise<WorkdayRecord>;

  reviewAdminValidation(
    input: ReviewWorkdayAdminValidationInput,
  ): Promise<WorkdayRecord>;

  listByUser(
    userId: string,
    filters?: Omit<WorkdayFilters, "userId">,
  ): Promise<WorkdayRecord[]>;

  listAdmin(filters?: WorkdayFilters): Promise<WorkdayRecord[]>;

  listIncidents(filters?: WorkdayFilters): Promise<WorkdayRecord[]>;
}

interface DbWorkdayRecordRow {
  id: string;
  user_id: string;
  work_date: string;
  check_in_at: string;
  check_out_at: string | null;
  status: WorkdayRecord["status"];
  worked_minutes: number | string;
  overtime_minutes: number | string;
  incident_flags: string | null;
  check_in_latitude: number | string;
  check_in_longitude: number | string;
  check_out_latitude: number | string | null;
  check_out_longitude: number | string | null;
  check_in_device_type: WorkdayDeviceType;
  check_out_device_type: WorkdayDeviceType | null;
  check_in_ip_address: string | null;
  check_out_ip_address: string | null;
  check_in_user_agent: string | null;
  check_out_user_agent: string | null;
  check_in_device_reason: string | null;
  check_out_device_reason: string | null;
  requires_admin_validation: number;
  admin_validation_reason: WorkdayRecord["adminValidationReason"];
  admin_validation_status: WorkdayRecord["adminValidationStatus"];
  admin_validated_by: string | null;
  admin_validated_at: string | null;
  admin_validation_comment: string | null;
  admin_close_comment: string | null;
  closed_by_admin_id: string | null;
  closed_by_admin_at: string | null;
  created_at: string;
  updated_at: string;
}

const parseIncidentFlags = (rawValue: string | null): IncidentFlag[] | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? (parsed as IncidentFlag[]) : null;
  } catch {
    return null;
  }
};

const mapRow = (row: DbWorkdayRecordRow): WorkdayRecord => ({
  id: row.id,
  userId: row.user_id,
  workDate: row.work_date,
  checkInAt: row.check_in_at,
  checkOutAt: row.check_out_at,
  status: row.status,
  workedMinutes: Number(row.worked_minutes),
  overtimeMinutes: Number(row.overtime_minutes),
  incidentFlags: parseIncidentFlags(row.incident_flags),
  checkInLatitude: Number(row.check_in_latitude),
  checkInLongitude: Number(row.check_in_longitude),
  checkOutLatitude:
    row.check_out_latitude === null ? null : Number(row.check_out_latitude),
  checkOutLongitude:
    row.check_out_longitude === null ? null : Number(row.check_out_longitude),
  checkInDeviceType: row.check_in_device_type,
  checkOutDeviceType: row.check_out_device_type,
  checkInIpAddress: row.check_in_ip_address,
  checkOutIpAddress: row.check_out_ip_address,
  checkInUserAgent: row.check_in_user_agent,
  checkOutUserAgent: row.check_out_user_agent,
  checkInDeviceReason: row.check_in_device_reason,
  checkOutDeviceReason: row.check_out_device_reason,
  requiresAdminValidation: Boolean(row.requires_admin_validation),
  adminValidationReason: row.admin_validation_reason,
  adminValidationStatus: row.admin_validation_status,
  adminValidatedBy: row.admin_validated_by,
  adminValidatedAt: row.admin_validated_at,
  adminValidationComment: row.admin_validation_comment,
  adminCloseComment: row.admin_close_comment,
  closedByAdminId: row.closed_by_admin_id,
  closedByAdminAt: row.closed_by_admin_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class MySqlWorkdayRecordsRepository implements WorkdayRecordsRepository {
  async createCheckIn(input: CreateCheckInInput): Promise<WorkdayRecord> {
    await getMySqlPool().query(
      `INSERT INTO workday_records (
        id, user_id, work_date, check_in_at, check_out_at,
        status, worked_minutes, overtime_minutes, incident_flags,
        check_in_latitude, check_in_longitude, check_out_latitude,
        check_out_longitude, check_in_device_type, check_out_device_type,
        check_in_ip_address, check_out_ip_address, check_in_user_agent,
        check_out_user_agent, check_in_device_reason, check_out_device_reason,
        requires_admin_validation, admin_validation_reason, admin_validation_status,
        admin_validated_by, admin_validated_at, admin_validation_comment,
        admin_close_comment, closed_by_admin_id, closed_by_admin_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, ?, NULL, ?, NULL, ?, NULL, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)`,
      [
        input.id,
        input.userId,
        input.workDate,
        input.checkInAt,
        input.status,
        input.workedMinutes,
        input.overtimeMinutes,
        input.incidentFlags ? JSON.stringify(input.incidentFlags) : null,
        input.checkInLatitude,
        input.checkInLongitude,
        input.checkInDeviceType,
        input.checkInIpAddress,
        input.checkInUserAgent,
        input.checkInDeviceReason,
        input.requiresAdminValidation ? 1 : 0,
        input.adminValidationReason,
        input.adminValidationStatus,
        input.createdAt,
        input.updatedAt,
      ],
    );
    const created = await this.findById(input.id);
    if (!created) throw new Error("No se pudo crear el registro de jornada.");
    return created;
  }

  async findOpenByUserId(userId: string): Promise<WorkdayRecord | null> {
    const [rows] = await getMySqlPool().query<DbWorkdayRecordRow[]>(
      `SELECT id, user_id, work_date, check_in_at, check_out_at, status,
              worked_minutes, overtime_minutes, incident_flags,
              check_in_latitude, check_in_longitude, check_out_latitude,
              check_out_longitude, check_in_device_type, check_out_device_type,
              check_in_ip_address, check_out_ip_address, check_in_user_agent,
              check_out_user_agent, check_in_device_reason, check_out_device_reason,
              requires_admin_validation, admin_validation_reason, admin_validation_status,
              admin_validated_by, admin_validated_at, admin_validation_comment,
              admin_close_comment, closed_by_admin_id, closed_by_admin_at,
              created_at, updated_at
       FROM workday_records
       WHERE user_id = ? AND status = 'OPEN'
       ORDER BY work_date DESC, created_at DESC
       LIMIT 1`,
      [userId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByUserIdAndDate(
    userId: string,
    workDate: string,
  ): Promise<WorkdayRecord | null> {
    const [rows] = await getMySqlPool().query<DbWorkdayRecordRow[]>(
      `SELECT id, user_id, work_date, check_in_at, check_out_at, status,
              worked_minutes, overtime_minutes, incident_flags,
              check_in_latitude, check_in_longitude, check_out_latitude,
              check_out_longitude, check_in_device_type, check_out_device_type,
              check_in_ip_address, check_out_ip_address, check_in_user_agent,
              check_out_user_agent, check_in_device_reason, check_out_device_reason,
              requires_admin_validation, admin_validation_reason, admin_validation_status,
              admin_validated_by, admin_validated_at, admin_validation_comment,
              admin_close_comment, closed_by_admin_id, closed_by_admin_at,
              created_at, updated_at
       FROM workday_records
       WHERE user_id = ? AND work_date = ?
       LIMIT 1`,
      [userId, workDate],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async closeCheckOut(input: CloseCheckOutInput): Promise<WorkdayRecord> {
    await getMySqlPool().query(
      `UPDATE workday_records
       SET check_out_at = ?,
           worked_minutes = ?,
           overtime_minutes = ?,
           status = ?,
           incident_flags = ?,
           check_out_latitude = ?,
           check_out_longitude = ?,
           check_out_device_type = ?,
           check_out_ip_address = ?,
           check_out_user_agent = ?,
           check_out_device_reason = ?,
           requires_admin_validation = ?,
           admin_validation_reason = ?,
           admin_validation_status = ?,
           admin_validated_by = ?,
           admin_validated_at = ?,
           admin_validation_comment = ?,
           admin_close_comment = ?,
           closed_by_admin_id = ?,
           closed_by_admin_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        input.checkOutAt,
        input.workedMinutes,
        input.overtimeMinutes,
        input.status,
        input.incidentFlags ? JSON.stringify(input.incidentFlags) : null,
        input.checkOutLatitude,
        input.checkOutLongitude,
        input.checkOutDeviceType,
        input.checkOutIpAddress,
        input.checkOutUserAgent,
        input.checkOutDeviceReason,
        input.requiresAdminValidation ? 1 : 0,
        input.adminValidationReason,
        input.adminValidationStatus,
        input.adminValidatedBy,
        input.adminValidatedAt,
        input.adminValidationComment,
        input.adminCloseComment ?? null,
        input.closedByAdminId ?? null,
        input.closedByAdminAt ?? null,
        input.updatedAt,
        input.recordId,
      ],
    );
    const updated = await this.findById(input.recordId);
    if (!updated) throw new Error("No se pudo actualizar el registro de jornada.");
    return updated;
  }

  async closeByAdmin(input: AdminCloseWorkdayRecordInput): Promise<WorkdayRecord> {
    await getMySqlPool().query(
      `UPDATE workday_records
       SET check_out_at = ?,
           worked_minutes = ?,
           overtime_minutes = ?,
           status = ?,
           incident_flags = ?,
           admin_close_comment = ?,
           closed_by_admin_id = ?,
           closed_by_admin_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        input.checkOutAt,
        input.workedMinutes,
        input.overtimeMinutes,
        input.status,
        input.incidentFlags ? JSON.stringify(input.incidentFlags) : null,
        input.adminCloseComment,
        input.closedByAdminId,
        input.closedByAdminAt,
        input.updatedAt,
        input.recordId,
      ],
    );

    const updated = await this.findById(input.recordId);
    if (!updated) {
      throw new Error("No se pudo cerrar la jornada desde administración.");
    }
    return updated;
  }

  async reviewAdminValidation(
    input: ReviewWorkdayAdminValidationInput,
  ): Promise<WorkdayRecord> {
    await getMySqlPool().query(
      `UPDATE workday_records
       SET admin_validation_status = ?,
           admin_validated_by = ?,
           admin_validated_at = ?,
           admin_validation_comment = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        input.adminValidationStatus,
        input.adminValidatedBy,
        input.adminValidatedAt,
        input.adminValidationComment,
        input.updatedAt,
        input.recordId,
      ],
    );

    const updated = await this.findById(input.recordId);
    if (!updated) {
      throw new Error("No se pudo actualizar la validación administrativa.");
    }
    return updated;
  }

  async listByUser(
    userId: string,
    filters?: Omit<WorkdayFilters, "userId">,
  ): Promise<WorkdayRecord[]> {
    const conditions = ["user_id = ?"];
    const values: unknown[] = [userId];

    if (filters?.dateFrom) {
      conditions.push("work_date >= ?");
      values.push(filters.dateFrom);
    }
    if (filters?.dateTo) {
      conditions.push("work_date <= ?");
      values.push(filters.dateTo);
    }
    if (filters?.status) {
      conditions.push("status = ?");
      values.push(filters.status);
    }

    const [rows] = await getMySqlPool().query<DbWorkdayRecordRow[]>(
      `SELECT id, user_id, work_date, check_in_at, check_out_at, status,
              worked_minutes, overtime_minutes, incident_flags,
              check_in_latitude, check_in_longitude, check_out_latitude,
              check_out_longitude, check_in_device_type, check_out_device_type,
              check_in_ip_address, check_out_ip_address, check_in_user_agent,
              check_out_user_agent, check_in_device_reason, check_out_device_reason,
              requires_admin_validation, admin_validation_reason, admin_validation_status,
              admin_validated_by, admin_validated_at, admin_validation_comment,
              admin_close_comment, closed_by_admin_id, closed_by_admin_at,
              created_at, updated_at
       FROM workday_records
       WHERE ${conditions.join(" AND ")}
       ORDER BY work_date DESC, created_at DESC`,
      values,
    );
    return rows.map(mapRow);
  }

  async listAdmin(filters?: WorkdayFilters): Promise<WorkdayRecord[]> {
    const conditions = ["1=1"];
    const values: unknown[] = [];

    if (filters?.userId) {
      conditions.push("user_id = ?");
      values.push(filters.userId);
    }
    if (filters?.dateFrom) {
      conditions.push("work_date >= ?");
      values.push(filters.dateFrom);
    }
    if (filters?.dateTo) {
      conditions.push("work_date <= ?");
      values.push(filters.dateTo);
    }
    if (filters?.status) {
      conditions.push("status = ?");
      values.push(filters.status);
    }

    const [rows] = await getMySqlPool().query<DbWorkdayRecordRow[]>(
      `SELECT id, user_id, work_date, check_in_at, check_out_at, status,
              worked_minutes, overtime_minutes, incident_flags,
              check_in_latitude, check_in_longitude, check_out_latitude,
              check_out_longitude, check_in_device_type, check_out_device_type,
              check_in_ip_address, check_out_ip_address, check_in_user_agent,
              check_out_user_agent, check_in_device_reason, check_out_device_reason,
              requires_admin_validation, admin_validation_reason, admin_validation_status,
              admin_validated_by, admin_validated_at, admin_validation_comment,
              admin_close_comment, closed_by_admin_id, closed_by_admin_at,
              created_at, updated_at
       FROM workday_records
       WHERE ${conditions.join(" AND ")}
       ORDER BY work_date DESC, created_at DESC`,
      values,
    );
    return rows.map(mapRow);
  }

  async listIncidents(filters?: WorkdayFilters): Promise<WorkdayRecord[]> {
    const conditions = ["status IN ('INCOMPLETE', 'INCIDENT')"];
    const values: unknown[] = [];

    if (filters?.userId) {
      conditions.push("user_id = ?");
      values.push(filters.userId);
    }
    if (filters?.dateFrom) {
      conditions.push("work_date >= ?");
      values.push(filters.dateFrom);
    }
    if (filters?.dateTo) {
      conditions.push("work_date <= ?");
      values.push(filters.dateTo);
    }

    const [rows] = await getMySqlPool().query<DbWorkdayRecordRow[]>(
      `SELECT id, user_id, work_date, check_in_at, check_out_at, status,
              worked_minutes, overtime_minutes, incident_flags,
              check_in_latitude, check_in_longitude, check_out_latitude,
              check_out_longitude, check_in_device_type, check_out_device_type,
              check_in_ip_address, check_out_ip_address, check_in_user_agent,
              check_out_user_agent, check_in_device_reason, check_out_device_reason,
              requires_admin_validation, admin_validation_reason, admin_validation_status,
              admin_validated_by, admin_validated_at, admin_validation_comment,
              admin_close_comment, closed_by_admin_id, closed_by_admin_at,
              created_at, updated_at
       FROM workday_records
       WHERE ${conditions.join(" AND ")}
       ORDER BY work_date DESC, created_at DESC`,
      values,
    );
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<WorkdayRecord | null> {
    const [rows] = await getMySqlPool().query<DbWorkdayRecordRow[]>(
      `SELECT id, user_id, work_date, check_in_at, check_out_at, status,
              worked_minutes, overtime_minutes, incident_flags,
              check_in_latitude, check_in_longitude, check_out_latitude,
              check_out_longitude, check_in_device_type, check_out_device_type,
              check_in_ip_address, check_out_ip_address, check_in_user_agent,
              check_out_user_agent, check_in_device_reason, check_out_device_reason,
              requires_admin_validation, admin_validation_reason, admin_validation_status,
              admin_validated_by, admin_validated_at, admin_validation_comment,
              admin_close_comment, closed_by_admin_id, closed_by_admin_at,
              created_at, updated_at
       FROM workday_records
       WHERE id = ?
       LIMIT 1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async listByIds(ids: string[]): Promise<WorkdayRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    const [rows] = await getMySqlPool().query<DbWorkdayRecordRow[]>(
      `SELECT id, user_id, work_date, check_in_at, check_out_at, status,
              worked_minutes, overtime_minutes, incident_flags,
              check_in_latitude, check_in_longitude, check_out_latitude,
              check_out_longitude, check_in_device_type, check_out_device_type,
              check_in_ip_address, check_out_ip_address, check_in_user_agent,
              check_out_user_agent, check_in_device_reason, check_out_device_reason,
              requires_admin_validation, admin_validation_reason, admin_validation_status,
              admin_validated_by, admin_validated_at, admin_validation_comment,
              admin_close_comment, closed_by_admin_id, closed_by_admin_at,
              created_at, updated_at
       FROM workday_records
       WHERE id IN (${ids.map(() => "?").join(", ")})`,
      ids,
    );

    return rows.map(mapRow);
  }
}

export const createWorkdayRecordsRepository =
  (): WorkdayRecordsRepository => new MySqlWorkdayRecordsRepository();

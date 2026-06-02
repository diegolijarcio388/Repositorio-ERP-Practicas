import { getMySqlPool } from "../../../core/db/mysql";
import type {
  DepartmentRecord,
  TimeControlDevicePolicy,
  UserDirectoryRecord,
  VacationRole,
} from "../domain/types";

interface DbUserRow {
  id: string;
  name: string;
  job_title: string | null;
  email: string;
  department_id: string;
  role: VacationRole;
  can_manage_time_control_requests: 0 | 1;
  time_control_device_policy: TimeControlDevicePolicy;
  time_control_shift_id: string | null;
  can_manage_vacations: 0 | 1;
  can_manage_projects: 0 | 1;
}

const mapUserRow = (row: DbUserRow): UserDirectoryRecord => ({
  id: row.id,
  name: row.name,
  jobTitle: row.job_title,
  email: row.email,
  departmentId: row.department_id,
  role: row.role,
  canManageTimeControlRequests: Boolean(row.can_manage_time_control_requests),
  timeControlDevicePolicy: row.time_control_device_policy,
  timeControlShiftId: row.time_control_shift_id,
  canManageVacations: Boolean(row.can_manage_vacations),
  canManageProjects: Boolean(row.can_manage_projects),
});

const USER_SELECT =
  "SELECT id, name, job_title, email, department_id, role, can_manage_time_control_requests, time_control_device_policy, time_control_shift_id, can_manage_vacations, can_manage_projects FROM users";

const isRecoverableDirectoryReadError = (error: unknown): boolean => {
  const errorRecord =
    error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();
  const sqlMessage = String(errorRecord?.sqlMessage ?? "").toLowerCase();
  const sqlState = String(errorRecord?.sqlState ?? "").toLowerCase();
  const errno = Number(errorRecord?.errno ?? 0);

  return (
    message.includes("doesn't exist in engine") ||
    sqlMessage.includes("doesn't exist in engine") ||
    message.includes("marked as crashed") ||
    sqlMessage.includes("marked as crashed") ||
    message.includes("incorrect information in file") ||
    sqlMessage.includes("incorrect information in file") ||
    message.includes("got error 168") ||
    sqlMessage.includes("got error 168") ||
    errno === 1932 ||
    sqlState === "42s02"
  );
};

const logDirectoryReadError = (context: string, error: unknown) => {
  console.error(`DirectoryRepository.${context} failed:`, error);
};

export class DirectoryRepository {
  async findUserById(userId: string): Promise<UserDirectoryRecord | null> {
    try {
      const [rows] = await getMySqlPool().query<DbUserRow[]>(
        `${USER_SELECT} WHERE id = ? LIMIT 1`,
        [userId],
      );
      const row = rows[0];
      return row ? mapUserRow(row) : null;
    } catch (error) {
      if (isRecoverableDirectoryReadError(error)) {
        logDirectoryReadError("findUserById", error);
        return null;
      }
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<UserDirectoryRecord | null> {
    try {
      const [rows] = await getMySqlPool().query<DbUserRow[]>(
        `${USER_SELECT} WHERE LOWER(email) = LOWER(?) LIMIT 1`,
        [email],
      );
      const row = rows[0];
      return row ? mapUserRow(row) : null;
    } catch (error) {
      if (isRecoverableDirectoryReadError(error)) {
        logDirectoryReadError("findUserByEmail", error);
        return null;
      }
      throw error;
    }
  }

  async listAdmins(): Promise<UserDirectoryRecord[]> {
    try {
      const [rows] = await getMySqlPool().query<DbUserRow[]>(
        `${USER_SELECT} WHERE role = 'admin' ORDER BY name ASC`,
      );
      return rows.map(mapUserRow);
    } catch (error) {
      if (isRecoverableDirectoryReadError(error)) {
        logDirectoryReadError("listAdmins", error);
        return [];
      }
      throw error;
    }
  }

  async listByDepartment(departmentId: string): Promise<UserDirectoryRecord[]> {
    try {
      const [rows] = await getMySqlPool().query<DbUserRow[]>(
        `${USER_SELECT} WHERE department_id = ? ORDER BY name ASC`,
        [departmentId],
      );
      return rows.map(mapUserRow);
    } catch (error) {
      if (isRecoverableDirectoryReadError(error)) {
        logDirectoryReadError("listByDepartment", error);
        return [];
      }
      throw error;
    }
  }

  async listAllUsers(): Promise<UserDirectoryRecord[]> {
    try {
      const [rows] = await getMySqlPool().query<DbUserRow[]>(
        `${USER_SELECT} ORDER BY name ASC`,
      );
      return rows.map(mapUserRow);
    } catch (error) {
      if (isRecoverableDirectoryReadError(error)) {
        logDirectoryReadError("listAllUsers", error);
        return [];
      }
      throw error;
    }
  }

  async listDepartments(): Promise<DepartmentRecord[]> {
    try {
      const [rows] = await getMySqlPool().query<
        Array<{ id: string; name: string; coordinator_user_id: string }>
      >("SELECT id, name, coordinator_user_id FROM departments ORDER BY name ASC");
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        coordinatorUserId: row.coordinator_user_id,
      }));
    } catch (error) {
      if (isRecoverableDirectoryReadError(error)) {
        logDirectoryReadError("listDepartments", error);
        return [];
      }
      throw error;
    }
  }

  async listDepartmentsByCoordinator(
    userId: string,
  ): Promise<DepartmentRecord[]> {
    try {
      const [rows] = await getMySqlPool().query<
        Array<{ id: string; name: string; coordinator_user_id: string }>
      >(
        "SELECT id, name, coordinator_user_id FROM departments WHERE coordinator_user_id = ? ORDER BY name ASC",
        [userId],
      );
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        coordinatorUserId: row.coordinator_user_id,
      }));
    } catch (error) {
      if (isRecoverableDirectoryReadError(error)) {
        logDirectoryReadError("listDepartmentsByCoordinator", error);
        return [];
      }
      throw error;
    }
  }

  async createUser(input: {
    name: string;
    jobTitle?: string | null;
    email: string;
    departmentId: string;
    role: string;
    canManageTimeControlRequests?: boolean;
    timeControlDevicePolicy?: TimeControlDevicePolicy;
    timeControlShiftId?: string | null;
    canManageVacations?: boolean;
    canManageProjects?: boolean;
  }): Promise<UserDirectoryRecord> {
    const id = crypto.randomUUID();
    await getMySqlPool().query(
      "INSERT INTO users (id, name, job_title, email, department_id, role, can_manage_time_control_requests, time_control_device_policy, time_control_shift_id, can_manage_vacations, can_manage_projects) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        input.name.trim(),
        input.jobTitle?.trim() || null,
        input.email.trim().toLowerCase(),
        input.departmentId,
        input.role,
        input.canManageTimeControlRequests ? 1 : 0,
        input.timeControlDevicePolicy ?? "TABLET_ONLY",
        input.timeControlShiftId ?? null,
        input.canManageVacations ? 1 : 0,
        input.canManageProjects ? 1 : 0,
      ],
    );
    return (await this.findUserById(id))!;
  }

  async deleteUser(id: string): Promise<void> {
    await getMySqlPool().query("DELETE FROM users WHERE id = ?", [id]);
  }

  async updateUser(
    id: string,
    input: {
      name?: string;
      jobTitle?: string | null;
      email?: string;
      departmentId?: string;
      role?: string;
      canManageTimeControlRequests?: boolean;
      timeControlDevicePolicy?: TimeControlDevicePolicy;
      timeControlShiftId?: string | null;
      canManageVacations?: boolean;
      canManageProjects?: boolean;
    },
  ): Promise<UserDirectoryRecord> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.name !== undefined) {
      fields.push("name = ?");
      values.push(input.name.trim());
    }
    if ("jobTitle" in input) {
      fields.push("job_title = ?");
      values.push(input.jobTitle?.trim() || null);
    }
    if (input.email !== undefined) {
      fields.push("email = ?");
      values.push(input.email.trim().toLowerCase());
    }
    if (input.departmentId !== undefined) {
      fields.push("department_id = ?");
      values.push(input.departmentId);
    }
    if (input.role !== undefined) {
      fields.push("role = ?");
      values.push(input.role);
    }
    if (input.canManageTimeControlRequests !== undefined) {
      fields.push("can_manage_time_control_requests = ?");
      values.push(input.canManageTimeControlRequests ? 1 : 0);
    }
    if (input.timeControlDevicePolicy !== undefined) {
      fields.push("time_control_device_policy = ?");
      values.push(input.timeControlDevicePolicy);
    }
    if ("timeControlShiftId" in input) {
      fields.push("time_control_shift_id = ?");
      values.push(input.timeControlShiftId ?? null);
    }
    if (input.canManageVacations !== undefined) {
      fields.push("can_manage_vacations = ?");
      values.push(input.canManageVacations ? 1 : 0);
    }
    if (input.canManageProjects !== undefined) {
      fields.push("can_manage_projects = ?");
      values.push(input.canManageProjects ? 1 : 0);
    }
    if (fields.length > 0) {
      values.push(id);
      await getMySqlPool().query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );
    }
    return (await this.findUserById(id))!;
  }

  async createDepartment(input: {
    name: string;
    coordinatorUserId: string | null;
  }): Promise<DepartmentRecord> {
    const id = crypto.randomUUID();
    await getMySqlPool().query(
      "INSERT INTO departments (id, name, coordinator_user_id) VALUES (?, ?, ?)",
      [id, input.name.trim(), input.coordinatorUserId ?? null],
    );
    const [rows] = await getMySqlPool().query<
      Array<{ id: string; name: string; coordinator_user_id: string }>
    >("SELECT id, name, coordinator_user_id FROM departments WHERE id = ?", [
      id,
    ]);
    return {
      id: rows[0].id,
      name: rows[0].name,
      coordinatorUserId: rows[0].coordinator_user_id,
    };
  }

  async updateDepartment(
    id: string,
    input: { name?: string; coordinatorUserId?: string },
  ): Promise<DepartmentRecord> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (input.name !== undefined) {
      fields.push("name = ?");
      values.push(input.name.trim());
    }
    if (input.coordinatorUserId !== undefined) {
      fields.push("coordinator_user_id = ?");
      values.push(input.coordinatorUserId);
    }
    if (fields.length > 0) {
      values.push(id);
      await getMySqlPool().query(
        `UPDATE departments SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );
    }
    const [rows] = await getMySqlPool().query<
      Array<{ id: string; name: string; coordinator_user_id: string }>
    >("SELECT id, name, coordinator_user_id FROM departments WHERE id = ?", [
      id,
    ]);
    return {
      id: rows[0].id,
      name: rows[0].name,
      coordinatorUserId: rows[0].coordinator_user_id,
    };
  }
}

export const createDirectoryRepository = () => new DirectoryRepository();

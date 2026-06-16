import { getMySqlPool } from "../../../core/db/mysql";
import type { AuthenticatedApiUser } from "../../vacations/domain/types";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type {
  CreatePermissionRequestInput,
  LegalPermissionType,
  PermissionRequestFilters,
  PermissionRequestRecord,
  PermissionRequestedUnitType,
  PermissionRequestStatus,
} from "../domain/types";
import {
  createPermissionRequestsRepository,
  type PermissionRequestsRepository,
} from "../repositories/permission-requests.repository";

interface CreateManualPermissionInput {
  userId: string;
  permissionDate: string;
  reason: string;
  legalPermissionType?: LegalPermissionType | null;
  attachmentUrl?: string | null;
  status?: PermissionRequestStatus;
  approverComment?: string;
}

const PERMISSION_RULES: Record<
  LegalPermissionType,
  { units: number | null; unitType: PermissionRequestedUnitType; label: string }
> = {
  MEDICAL: {
    units: null,
    unitType: "INDISPENSABLE_TIME",
    label: "Tiempo indispensable si es por Seguridad Social.",
  },
  MARRIAGE: {
    units: 15,
    unitType: "NATURAL_DAYS",
    label: "15 días naturales.",
  },
  DEATH_SPOUSE_PARENT_CHILD: {
    units: 4,
    unitType: "WORKING_DAYS",
    label: "4 días laborables.",
  },
  HOSPITALIZATION_OR_SECOND_DEGREE: {
    units: 2,
    unitType: "WORKING_DAYS",
    label: "2 días laborables, 4 si hay desplazamiento superior a 200 km.",
  },
  MOVING: {
    units: 1,
    unitType: "WORKING_DAYS",
    label: "1 día laborable.",
  },
  PUBLIC_DUTY: {
    units: null,
    unitType: "INDISPENSABLE_TIME",
    label: "Tiempo indispensable para deber público inexcusable.",
  },
  EXAM: {
    units: null,
    unitType: "INDISPENSABLE_TIME",
    label: "Tiempo indispensable.",
  },
};

const resolvePermissionRule = (type?: LegalPermissionType | null) =>
  type ? PERMISSION_RULES[type] : null;

const normalizeSqlDate = (value: string): string => {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("La fecha del permiso no es válida.");
  }
  return trimmed;
};

const canManagePermissions = (user: AuthenticatedApiUser): boolean =>
  user.role === "admin" ||
  user.role === "coordinator" ||
  user.canManageTimeControlRequests;

const hasGlobalTimeControlManagement = (
  user: AuthenticatedApiUser,
): boolean => user.role === "admin" || user.canManageTimeControlRequests;

const canReviewPermissionAsCoordinator = (
  user: AuthenticatedApiUser,
): boolean => user.role === "coordinator";

const canReviewPermissionAsAdmin = (
  user: AuthenticatedApiUser,
): boolean => user.role === "admin" || user.canManageTimeControlRequests;

const isMissingPermissionsTableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("permission_requests") &&
    (message.includes("doesn't exist") || message.includes("does not exist"))
  );
};

const sqlNow = (): string =>
  new Date().toISOString().slice(0, 23).replace("T", " ");
const todaySqlDate = (): string => new Date().toISOString().slice(0, 10);

export interface PermissionsService {
  listMine(user: AuthenticatedApiUser): Promise<PermissionRequestRecord[]>;
  listPendingForCoordinator(
    user: AuthenticatedApiUser,
  ): Promise<PermissionRequestRecord[]>;
  listPendingForAdmin(
    user: AuthenticatedApiUser,
  ): Promise<PermissionRequestRecord[]>;
  listManagementPermissions(
    user: AuthenticatedApiUser,
    filters?: PermissionRequestFilters,
  ): Promise<PermissionRequestRecord[]>;
  createRequest(
    user: AuthenticatedApiUser,
    input: {
      permissionDate: string;
      reason: string;
      legalPermissionType?: LegalPermissionType | null;
      attachmentUrl?: string | null;
    },
  ): Promise<PermissionRequestRecord>;
  createManualPermission(
    user: AuthenticatedApiUser,
    input: CreateManualPermissionInput,
  ): Promise<PermissionRequestRecord>;
  approveAsCoordinator(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ): Promise<PermissionRequestRecord>;
  rejectAsCoordinator(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ): Promise<PermissionRequestRecord>;
  approveAsAdmin(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ): Promise<PermissionRequestRecord>;
  rejectAsAdmin(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ): Promise<PermissionRequestRecord>;
  listApprovedPermissionUsersForTimeControlDate(
    user: AuthenticatedApiUser,
    date: string,
  ): Promise<Array<{ id: string; name: string }>>;
}

export class PermissionsServiceImpl implements PermissionsService {
  constructor(
    private readonly repository: PermissionRequestsRepository =
      createPermissionRequestsRepository(),
    private readonly directoryRepository = createDirectoryRepository(),
  ) {}

  private async getAllowedUsersForManagement(
    user: AuthenticatedApiUser,
  ): Promise<Array<{ id: string; name: string; departmentId: string }>> {
    if (hasGlobalTimeControlManagement(user)) {
      const allUsers = await this.directoryRepository.listAllUsers();
      return allUsers.map((entry) => ({
        id: entry.id,
        name: entry.name,
        departmentId: entry.departmentId,
      }));
    }
    if (!canManagePermissions(user)) throw new Error("FORBIDDEN");
    const departmentIds = new Set<string>(user.coordinatorDepartmentIds);
    if (departmentIds.size === 0) departmentIds.add(user.departmentId);
    const usersByDepartment = await Promise.all(
      Array.from(departmentIds).map((departmentId) =>
        this.directoryRepository.listByDepartment(departmentId),
      ),
    );
    return Array.from(
      new Map(
        usersByDepartment.flat().map((entry) => [
          entry.id,
          { id: entry.id, name: entry.name, departmentId: entry.departmentId },
        ]),
      ).values(),
    );
  }

  private async validateNoActiveRequestForDate(
    userId: string,
    permissionDate: string,
  ): Promise<void> {
    const [rows] = await getMySqlPool().query<Array<{ total: number }>>(
      `SELECT COUNT(*) AS total
       FROM permission_requests
       WHERE user_id = ?
         AND permission_date = ?
         AND status IN ('PENDING_COORDINATOR', 'PENDING_ADMIN', 'APPROVED')`,
      [userId, permissionDate],
    );

    if (Number(rows[0]?.total ?? 0) > 0) {
      throw new Error(
        "Ya existe una solicitud activa de permiso para esa fecha.",
      );
    }
  }

  private async attachUserNames(
    items: PermissionRequestRecord[],
  ): Promise<PermissionRequestRecord[]> {
    if (items.length === 0) return items;
    const allUsers = await this.directoryRepository.listAllUsers();
    const namesById = new Map(allUsers.map((entry) => [entry.id, entry.name]));
    return items.map((item) => ({
      ...item,
      userName: namesById.get(item.userId) ?? item.userName ?? item.userId,
    }));
  }

  async listMine(user: AuthenticatedApiUser): Promise<PermissionRequestRecord[]> {
    const items = await this.repository.listFiltered({ userId: user.userId });
    return this.attachUserNames(items);
  }

  async listPendingForCoordinator(
    user: AuthenticatedApiUser,
  ): Promise<PermissionRequestRecord[]> {
    if (!canReviewPermissionAsCoordinator(user)) {
      throw new Error("FORBIDDEN");
    }

    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const items = await this.repository.listFiltered({
      status: "PENDING_COORDINATOR",
      userIds: allowedUsers.map((entry) => entry.id),
    });
    return this.attachUserNames(items);
  }

  async listPendingForAdmin(
    user: AuthenticatedApiUser,
  ): Promise<PermissionRequestRecord[]> {
    if (!canReviewPermissionAsAdmin(user)) {
      throw new Error("FORBIDDEN");
    }
    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const userIds = allowedUsers.map((entry) => entry.id);
    const [coordinatorPendingItems, adminPendingItems] = await Promise.all([
      this.repository.listFiltered({
        status: "PENDING_COORDINATOR",
        userIds,
      }),
      this.repository.listFiltered({
        status: "PENDING_ADMIN",
        userIds,
      }),
    ]);
    return this.attachUserNames([
      ...adminPendingItems,
      ...coordinatorPendingItems,
    ]);
  }

  async listManagementPermissions(
    user: AuthenticatedApiUser,
    filters: PermissionRequestFilters = {},
  ): Promise<PermissionRequestRecord[]> {
    const allowedUsers = await this.getAllowedUsersForManagement(user);
    if (!allowedUsers.length) return [];
    const allowedUserIds = new Set(allowedUsers.map((entry) => entry.id));
    if (filters.userId && !allowedUserIds.has(filters.userId)) {
      throw new Error("FORBIDDEN");
    }
    const scopedUserIds = filters.userIds?.length
      ? filters.userIds.filter((entry) => allowedUserIds.has(entry))
      : allowedUsers.map((entry) => entry.id);
    if (!scopedUserIds.length) return [];
    const items = await this.repository
      .listFiltered({
        ...filters,
        userIds: scopedUserIds,
        departmentId: undefined,
      })
      .catch((error: unknown) => {
        if (isMissingPermissionsTableError(error)) return [];
        throw error;
      });
    const userNamesById = new Map(
      allowedUsers.map((entry) => [entry.id, entry.name]),
    );
    return items.map((item) => ({
      ...item,
      userName: userNamesById.get(item.userId) ?? null,
    }));
  }

  async createManualPermission(
    user: AuthenticatedApiUser,
    input: CreateManualPermissionInput,
  ): Promise<PermissionRequestRecord> {
    if (!canManagePermissions(user)) throw new Error("FORBIDDEN");
    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const targetUser = allowedUsers.find((entry) => entry.id === input.userId);
    if (!targetUser) {
      throw new Error("No autorizado para crear permisos para este usuario.");
    }
    const reason = input.reason.trim();
    if (!reason) throw new Error("Debes indicar un motivo para el permiso.");
    const status = input.status ?? "APPROVED";
    const rule = resolvePermissionRule(input.legalPermissionType);
    const payload: CreatePermissionRequestInput = {
      id: `prm-${crypto.randomUUID()}`,
      userId: targetUser.id,
      departmentId: targetUser.departmentId,
      permissionDate: normalizeSqlDate(input.permissionDate),
      permissionType: "FULL_DAY",
      legalPermissionType: input.legalPermissionType ?? null,
      attachmentUrl: input.attachmentUrl?.trim() || null,
      requestedUnits: rule?.units ?? null,
      requestedUnitType: rule?.unitType ?? null,
      reason,
      status,
      approverId:
        status === "APPROVED" || status === "REJECTED" ? user.userId : null,
      approverComment: input.approverComment?.trim() || null,
      createdAt: sqlNow(),
      updatedAt: sqlNow(),
    };
    return this.repository.create(payload);
  }

  async createRequest(
    user: AuthenticatedApiUser,
    input: {
      permissionDate: string;
      reason: string;
      legalPermissionType?: LegalPermissionType | null;
      attachmentUrl?: string | null;
    },
  ): Promise<PermissionRequestRecord> {
    const reason = input.reason.trim();
    if (!reason) throw new Error("Debes indicar un motivo para el permiso.");
    const normalizedDate = normalizeSqlDate(input.permissionDate);
    if (normalizedDate < todaySqlDate()) {
      throw new Error("No se puede solicitar permiso para días anteriores.");
    }
    await this.validateNoActiveRequestForDate(user.userId, normalizedDate);
    const rule = resolvePermissionRule(input.legalPermissionType);
    const payload: CreatePermissionRequestInput = {
      id: `prm-${crypto.randomUUID()}`,
      userId: user.userId,
      departmentId: user.departmentId,
      permissionDate: normalizedDate,
      permissionType: "FULL_DAY",
      legalPermissionType: input.legalPermissionType ?? null,
      attachmentUrl: input.attachmentUrl?.trim() || null,
      requestedUnits: rule?.units ?? null,
      requestedUnitType: rule?.unitType ?? null,
      reason,
      status: "PENDING_COORDINATOR",
      approverId: null,
      approverComment: null,
      createdAt: sqlNow(),
      updatedAt: sqlNow(),
    };
    return this.repository.create(payload);
  }

  private async updateRequestStatus(
    user: AuthenticatedApiUser,
    requestId: string,
    currentStatus: "PENDING_COORDINATOR" | "PENDING_ADMIN",
    nextStatus: PermissionRequestStatus,
    comment?: string | null,
  ): Promise<PermissionRequestRecord> {
    const request = await this.getReviewableRequest(
      user,
      requestId,
      currentStatus,
    );
    const normalizedComment = comment?.trim() || null;
    if (nextStatus === "REJECTED" && !normalizedComment) {
      throw new Error("Debes indicar un motivo para rechazar la solicitud.");
    }
    const updated = await this.repository.updateStatus({
      id: request.id,
      status: nextStatus,
      approverId: user.userId,
      approverComment: normalizedComment,
      updatedAt: sqlNow(),
    });
    if (!updated) throw new Error("No se pudo actualizar la solicitud.");
    return updated;
  }

  private async getReviewableRequest(
    user: AuthenticatedApiUser,
    requestId: string,
    expectedStatus: "PENDING_COORDINATOR" | "PENDING_ADMIN",
  ): Promise<PermissionRequestRecord> {
    if (
      expectedStatus === "PENDING_COORDINATOR" &&
      !canReviewPermissionAsCoordinator(user)
    ) {
      throw new Error("FORBIDDEN");
    }

    if (expectedStatus === "PENDING_ADMIN" && !canReviewPermissionAsAdmin(user)) {
      throw new Error("FORBIDDEN");
    }

    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const allowedUserIds = new Set(allowedUsers.map((entry) => entry.id));
    const request = await this.repository.getById(requestId);

    if (!request || !allowedUserIds.has(request.userId)) {
      throw new Error("Solicitud de permiso no encontrada.");
    }

    if (request.status !== expectedStatus) {
      throw new Error("La solicitud no está en el estado esperado.");
    }

    return request;
  }

  approveAsCoordinator(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ) {
    return this.updateRequestStatus(
      user,
      input.requestId,
      "PENDING_COORDINATOR",
      "PENDING_ADMIN",
      input.comment,
    );
  }
  rejectAsCoordinator(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ) {
    return this.updateRequestStatus(
      user,
      input.requestId,
      "PENDING_COORDINATOR",
      "REJECTED",
      input.comment,
    );
  }
  approveAsAdmin(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ) {
    return this.updateRequestStatus(
      user,
      input.requestId,
      "PENDING_ADMIN",
      "APPROVED",
      input.comment,
    );
  }
  rejectAsAdmin(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ) {
    return this.updateRequestStatus(
      user,
      input.requestId,
      "PENDING_ADMIN",
      "REJECTED",
      input.comment,
    );
  }

  async listApprovedPermissionUsersForTimeControlDate(
    user: AuthenticatedApiUser,
    date: string,
  ): Promise<Array<{ id: string; name: string }>> {
    const allowedUsers = await this.getAllowedUsersForManagement(user);
    if (!allowedUsers.length) return [];
    const requests = await this.repository
      .listFiltered({
        status: "APPROVED",
        userIds: allowedUsers.map((entry) => entry.id),
        dateFrom: date,
        dateTo: date,
      })
      .catch((error: unknown) => {
        if (isMissingPermissionsTableError(error)) return [];
        throw error;
      });
    const approvedUserIds = new Set(requests.map((request) => request.userId));
    return allowedUsers
      .filter((entry) => approvedUserIds.has(entry.id))
      .map((entry) => ({ id: entry.id, name: entry.name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }
}

export const createPermissionsService = (): PermissionsService =>
  new PermissionsServiceImpl();

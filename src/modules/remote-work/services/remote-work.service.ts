import { getMySqlPool } from "../../../core/db/mysql";
import type { AuthenticatedApiUser } from "../../vacations/domain/types";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type {
  CreateRemoteWorkRequestInput,
  RemoteWorkRequestRecord,
  RemoteWorkRequestStatus,
} from "../domain/types";
import {
  createRemoteWorkRequestsRepository,
  type RemoteWorkRequestsRepository,
} from "../repositories/remote-work-requests.repository";

interface CreateManualRemoteWorkInput {
  userId: string;
  remoteWorkDate: string;
  reason: string;
  status?: RemoteWorkRequestStatus;
  approverComment?: string;
}

const normalizeSqlDate = (value: string): string => {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("La fecha del teletrabajo no es válida.");
  }
  return trimmed;
};

const canManageRemoteWork = (user: AuthenticatedApiUser): boolean =>
  user.role === "admin" ||
  user.role === "coordinator" ||
  user.canManageTimeControlRequests;

const hasGlobalTimeControlManagement = (
  user: AuthenticatedApiUser,
): boolean => user.role === "admin" || user.canManageTimeControlRequests;

const canReviewRemoteWorkAsCoordinator = (
  user: AuthenticatedApiUser,
): boolean => user.role === "coordinator";

const canReviewRemoteWorkAsAdmin = (
  user: AuthenticatedApiUser,
): boolean => user.role === "admin" || user.canManageTimeControlRequests;

const isMissingRemoteWorkTableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("remote_work_requests") &&
    (message.includes("doesn't exist") || message.includes("does not exist"))
  );
};

const sqlNow = (): string =>
  new Date().toISOString().slice(0, 23).replace("T", " ");
const todaySqlDate = (): string => new Date().toISOString().slice(0, 10);

export interface RemoteWorkService {
  listMine(user: AuthenticatedApiUser): Promise<RemoteWorkRequestRecord[]>;
  listPendingForCoordinator(
    user: AuthenticatedApiUser,
  ): Promise<RemoteWorkRequestRecord[]>;
  listPendingForAdmin(
    user: AuthenticatedApiUser,
  ): Promise<RemoteWorkRequestRecord[]>;
  listManagementRemoteWork(
    user: AuthenticatedApiUser,
    filters: { status?: RemoteWorkRequestStatus; dateFrom?: string; dateTo?: string; userId?: string },
  ): Promise<RemoteWorkRequestRecord[]>;
  createManualRemoteWork(
    user: AuthenticatedApiUser,
    input: CreateManualRemoteWorkInput,
  ): Promise<RemoteWorkRequestRecord>;
  listApprovedRemoteWorkUsersForTimeControlDate(
    user: AuthenticatedApiUser,
    date: string,
  ): Promise<Array<{ id: string; name: string }>>;
  createRequest(
    user: AuthenticatedApiUser,
    input: { remoteWorkDate: string; reason: string },
  ): Promise<RemoteWorkRequestRecord>;
  approveAsCoordinator(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ): Promise<RemoteWorkRequestRecord>;
  rejectAsCoordinator(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ): Promise<RemoteWorkRequestRecord>;
  approveAsAdmin(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ): Promise<RemoteWorkRequestRecord>;
  rejectAsAdmin(
    user: AuthenticatedApiUser,
    input: { requestId: string; comment?: string | null },
  ): Promise<RemoteWorkRequestRecord>;
}

export class RemoteWorkServiceImpl implements RemoteWorkService {
  constructor(
    private readonly repository: RemoteWorkRequestsRepository =
      createRemoteWorkRequestsRepository(),
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
    if (!canManageRemoteWork(user)) throw new Error("FORBIDDEN");
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
    remoteWorkDate: string,
  ): Promise<void> {
    const [rows] = await getMySqlPool().query<Array<{ total: number }>>(
      `SELECT COUNT(*) AS total
       FROM remote_work_requests
       WHERE user_id = ?
         AND remote_work_date = ?
         AND status IN ('PENDING_COORDINATOR', 'PENDING_ADMIN', 'APPROVED')`,
      [userId, remoteWorkDate],
    );

    if (Number(rows[0]?.total ?? 0) > 0) {
      throw new Error(
        "Ya existe una solicitud activa de teletrabajo para esa fecha.",
      );
    }
  }

  private async attachUserNames(
    items: RemoteWorkRequestRecord[],
  ): Promise<RemoteWorkRequestRecord[]> {
    if (items.length === 0) return items;
    const allUsers = await this.directoryRepository.listAllUsers();
    const namesById = new Map(allUsers.map((entry) => [entry.id, entry.name]));
    return items.map((item) => ({
      ...item,
      userName: namesById.get(item.userId) ?? item.userName ?? item.userId,
    }));
  }

  async listMine(user: AuthenticatedApiUser): Promise<RemoteWorkRequestRecord[]> {
    const items = await this.repository.listFiltered({ userId: user.userId });
    return this.attachUserNames(items);
  }

  async listPendingForCoordinator(
    user: AuthenticatedApiUser,
  ): Promise<RemoteWorkRequestRecord[]> {
    if (!canReviewRemoteWorkAsCoordinator(user)) {
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
  ): Promise<RemoteWorkRequestRecord[]> {
    if (!canReviewRemoteWorkAsAdmin(user)) {
      throw new Error("FORBIDDEN");
    }
    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const items = await this.repository.listFiltered({
      status: "PENDING_ADMIN",
      userIds: allowedUsers.map((entry) => entry.id),
    });
    return this.attachUserNames(items);
  }

  async listManagementRemoteWork(
    user: AuthenticatedApiUser,
    filters: { status?: RemoteWorkRequestStatus; dateFrom?: string; dateTo?: string; userId?: string },
  ): Promise<RemoteWorkRequestRecord[]> {
    if (!canManageRemoteWork(user)) {
      throw new Error("FORBIDDEN");
    }

    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const allowedUserIds = new Set(allowedUsers.map((u) => u.id));

    if (filters.userId && !allowedUserIds.has(filters.userId)) {
      throw new Error("FORBIDDEN");
    }

    const items = await this.repository.listFiltered({
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      userId: filters.userId,
      userIds: filters.userId ? undefined : Array.from(allowedUserIds),
    });

    return this.attachUserNames(items);
  }

  async createManualRemoteWork(
    user: AuthenticatedApiUser,
    input: CreateManualRemoteWorkInput,
  ): Promise<RemoteWorkRequestRecord> {
    if (!canManageRemoteWork(user)) throw new Error("FORBIDDEN");
    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const targetUser = allowedUsers.find((entry) => entry.id === input.userId);
    if (!targetUser) {
      throw new Error("No autorizado para crear teletrabajo para este usuario.");
    }
    const reason = input.reason.trim();
    if (!reason) throw new Error("Debes indicar un motivo para el teletrabajo.");
    const status = input.status ?? "APPROVED";
    const payload: CreateRemoteWorkRequestInput = {
      id: `rwr-${crypto.randomUUID()}`,
      userId: targetUser.id,
      departmentId: targetUser.departmentId,
      remoteWorkDate: normalizeSqlDate(input.remoteWorkDate),
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

  async listApprovedRemoteWorkUsersForTimeControlDate(
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
        if (isMissingRemoteWorkTableError(error)) return [];
        throw error;
      });
    const approvedUserIds = new Set(requests.map((request) => request.userId));
    return allowedUsers
      .filter((entry) => approvedUserIds.has(entry.id))
      .map((entry) => ({ id: entry.id, name: entry.name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async createRequest(
    user: AuthenticatedApiUser,
    input: { remoteWorkDate: string; reason: string },
  ): Promise<RemoteWorkRequestRecord> {
    const reason = input.reason.trim();
    if (!reason) throw new Error("Debes indicar un motivo para el teletrabajo.");
    const normalizedDate = normalizeSqlDate(input.remoteWorkDate);
    if (normalizedDate < todaySqlDate()) {
      throw new Error("No se puede solicitar teletrabajo para días anteriores.");
    }
    await this.validateNoActiveRequestForDate(user.userId, normalizedDate);
    const payload: CreateRemoteWorkRequestInput = {
      id: `rwr-${crypto.randomUUID()}`,
      userId: user.userId,
      departmentId: user.departmentId,
      remoteWorkDate: normalizedDate,
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
    nextStatus: RemoteWorkRequestStatus,
    comment?: string | null,
  ): Promise<RemoteWorkRequestRecord> {
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
  ): Promise<RemoteWorkRequestRecord> {
    if (
      expectedStatus === "PENDING_COORDINATOR" &&
      !canReviewRemoteWorkAsCoordinator(user)
    ) {
      throw new Error("FORBIDDEN");
    }

    if (expectedStatus === "PENDING_ADMIN" && !canReviewRemoteWorkAsAdmin(user)) {
      throw new Error("FORBIDDEN");
    }

    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const allowedUserIds = new Set(allowedUsers.map((entry) => entry.id));
    const request = await this.repository.getById(requestId);

    if (!request || !allowedUserIds.has(request.userId)) {
      throw new Error("Solicitud de teletrabajo no encontrada.");
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
}

export const createRemoteWorkService = (): RemoteWorkService =>
  new RemoteWorkServiceImpl();

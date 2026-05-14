import { getMySqlPool } from "../../../core/db/mysql";
import type { AuthenticatedApiUser } from "../../vacations/domain/types";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type {
  AdjustmentRequestType,
  CreateWorkdayAdjustmentRequestInput,
  WorkdayAdjustmentRequest,
  WorkdayAdjustmentRequestFilters,
} from "../domain/types";
import {
  createWorkdayAdjustmentRequestsRepository,
  type WorkdayAdjustmentRequestsRepository,
} from "../repositories/workday-adjustment-requests.repository";

interface CreateAdjustmentRequestInput {
  requestType: AdjustmentRequestType;
  requestedTime: string;
  reason: string;
  requestedLatitude?: number | null;
  requestedLongitude?: number | null;
}

interface ReviewAdjustmentRequestInput {
  requestId: string;
  comment?: string | null;
}

const toSqlDate = (value: Date): string => value.toISOString().slice(0, 10);

const isFutureDateTime = (value: string): boolean => {
  const timestamp = Date.parse(value.replace(" ", "T"));
  if (Number.isNaN(timestamp)) {
    throw new Error("La fecha y hora solicitadas no son válidas.");
  }

  return timestamp > Date.now();
};

const nowSqlDateTime = (): string =>
  new Date().toISOString().slice(0, 23).replace("T", " ");

const normalizeComment = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const canManageAdjustmentRequests = (
  user: AuthenticatedApiUser,
): boolean =>
  user.role === "admin" ||
  user.role === "coordinator" ||
  user.canManageTimeControlRequests;

const hasGlobalTimeControlManagement = (
  user: AuthenticatedApiUser,
): boolean => user.role === "admin" || user.canManageTimeControlRequests;

const canReviewCoordinatorStep = (user: AuthenticatedApiUser): boolean =>
  user.role === "coordinator";

const canReviewAdminStep = (user: AuthenticatedApiUser): boolean =>
  user.role === "admin" || user.canManageTimeControlRequests;

export interface WorkdayAdjustmentsService {
  getMyRequests(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayAdjustmentRequest[]>;

  createRequest(
    user: AuthenticatedApiUser,
    input: CreateAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest>;

  listPendingForCoordinator(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayAdjustmentRequest[]>;

  listPendingForAdmin(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayAdjustmentRequest[]>;

  approveAsCoordinator(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest>;

  rejectAsCoordinator(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest>;

  approveAsAdmin(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest>;

  rejectAsAdmin(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest>;
}

export class WorkdayAdjustmentsServiceImpl
  implements WorkdayAdjustmentsService
{
  constructor(
    private readonly repository: WorkdayAdjustmentRequestsRepository =
      createWorkdayAdjustmentRequestsRepository(),
    private readonly directoryRepository = createDirectoryRepository(),
  ) {}

  async getMyRequests(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayAdjustmentRequest[]> {
    return this.repository.listFiltered({ userId: user.userId });
  }

  async createRequest(
    user: AuthenticatedApiUser,
    input: CreateAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest> {
    const reason = input.reason.trim();
    if (!reason) {
      throw new Error("Debes indicar un motivo para la solicitud.");
    }

    if (!input.requestedTime.trim()) {
      throw new Error("Debes indicar la fecha y hora solicitadas.");
    }

    if (isFutureDateTime(input.requestedTime)) {
      throw new Error("No se pueden solicitar fichajes en fechas futuras.");
    }

    const nowDateTime = nowSqlDateTime();
    const requestedTime = input.requestedTime;
    const requestDate = toSqlDate(new Date(requestedTime.replace(" ", "T")));

    await this.validateRequestChronology(
      user.userId,
      input.requestType,
      requestedTime,
    );

    const payload: CreateWorkdayAdjustmentRequestInput = {
      id: `war-${crypto.randomUUID()}`,
      userId: user.userId,
      requestDate,
      requestType: input.requestType,
      requestedTime,
      requestedLatitude: input.requestedLatitude ?? null,
      requestedLongitude: input.requestedLongitude ?? null,
      reason,
      status: "PENDING_ADMIN",
      coordinatorComment: null,
      adminComment: null,
      reviewedByCoordinatorId: null,
      reviewedByAdminId: null,
      createdAt: nowDateTime,
      updatedAt: nowDateTime,
    };

    return this.repository.createRequest(payload);
  }

  private async validateRequestChronology(
    userId: string,
    requestType: AdjustmentRequestType,
    requestedTime: string,
  ): Promise<void> {
    const [pendingSameRequestRows] = await getMySqlPool().query<
      Array<{ total: number }>
    >(
      `SELECT COUNT(*) AS total
       FROM workday_adjustment_requests
       WHERE user_id = ?
         AND request_type = ?
         AND requested_time = ?
         AND status IN ('PENDING_ADMIN', 'PENDING_COORDINATOR')`,
      [userId, requestType, requestedTime],
    );
    const pendingSameRequests = Number(pendingSameRequestRows[0]?.total ?? 0);

    if (pendingSameRequests > 0) {
      throw new Error(
        "Ya existe una solicitud pendiente para ese fichaje.",
      );
    }

    const [exactCheckInRows] = await getMySqlPool().query<
      Array<{ total: number }>
    >(
      `SELECT COUNT(*) AS total
       FROM workday_records
       WHERE user_id = ?
         AND check_in_at = ?`,
      [userId, requestedTime],
    );
    const exactCheckIns = Number(exactCheckInRows[0]?.total ?? 0);

    if (exactCheckIns > 0 && requestType === "CHECK_IN") {
      throw new Error(
        "Ya existe un fichaje de entrada en esa fecha y hora.",
      );
    }

    const [overlapRows] = await getMySqlPool().query<Array<{ total: number }>>(
      `SELECT COUNT(*) AS total
       FROM workday_records
       WHERE user_id = ?
         AND check_in_at <= ?
         AND (check_out_at IS NULL OR check_out_at >= ?)`,
      [userId, requestedTime, requestedTime],
    );
    const overlappingRecords = Number(overlapRows[0]?.total ?? 0);

    if (requestType === "CHECK_IN") {
      if (overlappingRecords > 0) {
        throw new Error(
          "No puedes solicitar una entrada en una franja ya cubierta por otra jornada.",
        );
      }
      return;
    }

    const [openBeforeRows] = await getMySqlPool().query<
      Array<{ id: string; check_in_at: string }>
    >(
      `SELECT id, check_in_at
       FROM workday_records
       WHERE user_id = ?
         AND check_in_at <= ?
         AND check_out_at IS NULL
       ORDER BY check_in_at DESC
       LIMIT 1`,
      [userId, requestedTime],
    );
    const openBefore = openBeforeRows[0] ?? null;

    if (!openBefore) {
      throw new Error(
        "No puedes solicitar una salida sin tener una entrada abierta previa.",
      );
    }
  }

  async listPendingForCoordinator(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayAdjustmentRequest[]> {
    if (!canReviewCoordinatorStep(user)) {
      throw new Error("FORBIDDEN");
    }

    return [];
  }

  async listPendingForAdmin(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayAdjustmentRequest[]> {
    if (!canReviewAdminStep(user)) {
      throw new Error("FORBIDDEN");
    }

    const allowedUsers = await this.getAllowedUsersForManagement(user);
    return this.listScopedRequests(allowedUsers, {
      status: "PENDING_ADMIN",
    });
  }

  async approveAsCoordinator(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest> {
    return this.reviewCoordinatorStep(user, input, "PENDING_ADMIN");
  }

  async rejectAsCoordinator(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest> {
    return this.reviewCoordinatorStep(user, input, "REJECTED");
  }

  async approveAsAdmin(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest> {
    return this.reviewAdminStep(user, input, "APPROVED");
  }

  async rejectAsAdmin(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
  ): Promise<WorkdayAdjustmentRequest> {
    return this.reviewAdminStep(user, input, "REJECTED");
  }

  private async reviewCoordinatorStep(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
    nextStatus: "PENDING_ADMIN" | "REJECTED",
  ): Promise<WorkdayAdjustmentRequest> {
    if (!canReviewCoordinatorStep(user)) {
      throw new Error("FORBIDDEN");
    }

    const request = await this.getReviewableRequest(
      user,
      input.requestId,
      ["PENDING_COORDINATOR"],
    );
    const comment = normalizeComment(input.comment);

    if (nextStatus === "REJECTED" && !comment) {
      throw new Error("Debes indicar un motivo para rechazar la solicitud.");
    }

    return this.repository.updateReview({
      requestId: request.id,
      status: nextStatus,
      coordinatorComment: comment,
      reviewedByCoordinatorId: user.userId,
      updatedAt: nowSqlDateTime(),
    });
  }

  private async reviewAdminStep(
    user: AuthenticatedApiUser,
    input: ReviewAdjustmentRequestInput,
    nextStatus: "APPROVED" | "REJECTED",
  ): Promise<WorkdayAdjustmentRequest> {
    if (!canReviewAdminStep(user)) {
      throw new Error("FORBIDDEN");
    }

    const request = await this.getReviewableRequest(
      user,
      input.requestId,
      ["PENDING_ADMIN", "PENDING_COORDINATOR"],
    );
    const comment = normalizeComment(input.comment);

    if (nextStatus === "REJECTED" && !comment) {
      throw new Error("Debes indicar un motivo para rechazar la solicitud.");
    }

    const updatedRequest = await this.repository.updateReview({
      requestId: request.id,
      status: nextStatus,
      adminComment: comment,
      reviewedByAdminId: user.userId,
      updatedAt: nowSqlDateTime(),
    });

    // If approved, we need to apply the actual change to workday_records
    if (nextStatus === "APPROVED") {
      await this.applyAdjustmentToRecords(updatedRequest);
    }

    return updatedRequest;
  }

  private async applyAdjustmentToRecords(
    request: WorkdayAdjustmentRequest,
  ): Promise<void> {
    const now = nowSqlDateTime();
    const id = `wr-${crypto.randomUUID()}`;
    const workDate = request.requestedTime.split(" ")[0];
    
    if (request.requestType === "CHECK_IN") {
      const [overlapRows] = await getMySqlPool().query<Array<{ total: number }>>(
        `SELECT COUNT(*) AS total
         FROM workday_records
         WHERE user_id = ?
           AND check_in_at <= ?
           AND (check_out_at IS NULL OR check_out_at >= ?)`,
        [request.userId, request.requestedTime, request.requestedTime],
      );
      const overlappingRecords = Number(overlapRows[0]?.total ?? 0);
      if (overlappingRecords > 0) {
        throw new Error(
          "No se puede aplicar la entrada: el usuario ya tiene una jornada en esa franja.",
        );
      }

      await getMySqlPool().query(
        `INSERT INTO workday_records 
         (id, user_id, work_date, check_in_at, status, worked_minutes, overtime_minutes, check_in_latitude, check_in_longitude, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          request.userId,
          workDate,
          request.requestedTime,
          "INCOMPLETE",
          0,
          0,
          request.requestedLatitude ?? 0,
          request.requestedLongitude ?? 0,
          now,
          now,
        ],
      );
    } else {
      const [openRows] = await getMySqlPool().query<
        Array<{ id: string; check_in_at: string }>
      >(
        `SELECT id, check_in_at
         FROM workday_records
         WHERE user_id = ?
           AND check_out_at IS NULL
         ORDER BY check_in_at DESC
         LIMIT 1`,
        [request.userId],
      );
      const openRecord = openRows[0] ?? null;
      if (!openRecord || openRecord.check_in_at > request.requestedTime) {
        throw new Error(
          "No se puede aplicar la salida: no existe una entrada abierta previa.",
        );
      }

      await getMySqlPool().query(
        `UPDATE workday_records
         SET check_out_at = ?,
             worked_minutes = GREATEST(TIMESTAMPDIFF(MINUTE, check_in_at, ?), 0),
             status = ?,
             check_out_latitude = ?,
             check_out_longitude = ?,
             updated_at = ?
         WHERE id = ?`,
        [
          request.requestedTime,
          request.requestedTime,
          "COMPLETED",
          request.requestedLatitude ?? 0,
          request.requestedLongitude ?? 0,
          now,
          openRecord.id,
        ],
      );
    }
  }

  private async getReviewableRequest(
    user: AuthenticatedApiUser,
    requestId: string,
    expectedStatuses: WorkdayAdjustmentRequest["status"][],
  ): Promise<WorkdayAdjustmentRequest> {
    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const allowedUserIds = new Set(allowedUsers.map((entry) => entry.id));
    const request = await this.repository.findById(requestId);

    if (!request || !allowedUserIds.has(request.userId)) {
      throw new Error("No se encontró la solicitud indicada.");
    }

    if (!expectedStatuses.includes(request.status)) {
      throw new Error("La solicitud no está pendiente en este paso.");
    }

    return request;
  }

  private async getAllowedUsersForManagement(
    user: AuthenticatedApiUser,
  ): Promise<Array<{ id: string; name: string; departmentId: string }>> {
    if (!canManageAdjustmentRequests(user)) {
      throw new Error("FORBIDDEN");
    }

    if (hasGlobalTimeControlManagement(user)) {
      const allUsers = await this.directoryRepository.listAllUsers();
      return allUsers.map((entry) => ({
        id: entry.id,
        name: entry.name,
        departmentId: entry.departmentId,
      }));
    }

    const departmentIds = new Set<string>(user.coordinatorDepartmentIds);
    if (departmentIds.size === 0) {
      departmentIds.add(user.departmentId);
    }

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

  private async listScopedRequests(
    allowedUsers: Array<{ id: string; name: string }>,
    filters: WorkdayAdjustmentRequestFilters,
  ): Promise<WorkdayAdjustmentRequest[]> {
    if (!allowedUsers.length) {
      return [];
    }

    const userNamesById = new Map(
      allowedUsers.map((entry) => [entry.id, entry.name]),
    );
    const items = await this.repository.listFiltered({
      ...filters,
      userIds: allowedUsers.map((entry) => entry.id),
    });

    return items.map((item) => ({
      ...item,
      userName: userNamesById.get(item.userId) ?? null,
    }));
  }
}

export const createWorkdayAdjustmentsService =
  (): WorkdayAdjustmentsService => new WorkdayAdjustmentsServiceImpl();

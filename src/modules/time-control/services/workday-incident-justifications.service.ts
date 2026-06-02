import type { AuthenticatedApiUser } from "../../vacations/domain/types";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type {
  CreateWorkdayIncidentJustificationInput,
  IncidentFlag,
  JustifiableIncidentFlag,
  WorkdayIncidentJustification,
  WorkdayIncidentJustificationFilters,
} from "../domain/types";
import {
  createWorkdayIncidentJustificationsRepository,
  type WorkdayIncidentJustificationsRepository,
} from "../repositories/workday-incident-justifications.repository";
import {
  createWorkdayRecordsRepository,
  type WorkdayRecordsRepository,
} from "../repositories/workday-records.repository";

interface CreateIncidentJustificationInput {
  recordId: string;
  reason: string;
}

interface ReviewIncidentJustificationInput {
  justificationId: string;
  comment?: string | null;
}

const JUSTIFIABLE_INCIDENT_FLAGS: JustifiableIncidentFlag[] = [
  "DURATION_TOO_SHORT",
  "DURATION_TOO_LONG",
  "OUT_OF_SCHEDULE",
];

const nowSqlDateTime = (): string =>
  new Date().toISOString().slice(0, 23).replace("T", " ");

const normalizeComment = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const hasJustifiableIncident = (flags: IncidentFlag[] | null): boolean => {
  if (!flags?.length) return false;
  return flags.some((flag) =>
    JUSTIFIABLE_INCIDENT_FLAGS.includes(flag as JustifiableIncidentFlag),
  );
};

const hasHoursIncident = (flags: IncidentFlag[] | null): boolean => {
  if (!flags?.length) return false;
  return flags.some(
    (flag) => flag === "DURATION_TOO_SHORT" || flag === "DURATION_TOO_LONG",
  );
};

const canManageIncidentJustifications = (
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

export interface WorkdayIncidentJustificationsService {
  getMyJustifications(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayIncidentJustification[]>;

  deleteMyJustification(
    user: AuthenticatedApiUser,
    justificationId: string,
  ): Promise<void>;

  createMyJustification(
    user: AuthenticatedApiUser,
    input: CreateIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification>;

  listPendingForCoordinator(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayIncidentJustification[]>;

  listPendingForAdmin(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayIncidentJustification[]>;

  approveAsCoordinator(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification>;

  rejectAsCoordinator(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification>;

  approveAsAdmin(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification>;

  rejectAsAdmin(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification>;
}

export class WorkdayIncidentJustificationsServiceImpl
  implements WorkdayIncidentJustificationsService
{
  constructor(
    private readonly repository: WorkdayIncidentJustificationsRepository =
      createWorkdayIncidentJustificationsRepository(),
    private readonly workdayRecordsRepository: WorkdayRecordsRepository =
      createWorkdayRecordsRepository(),
    private readonly directoryRepository = createDirectoryRepository(),
  ) {}

  async getMyJustifications(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayIncidentJustification[]> {
    const items = await this.repository.listFiltered({ userId: user.userId });
    return this.attachRecordDetails(items);
  }

  async deleteMyJustification(
    user: AuthenticatedApiUser,
    justificationId: string,
  ): Promise<void> {
    const justification = await this.repository.findById(justificationId);

    if (!justification || justification.userId !== user.userId) {
      throw new Error("No se encontró la justificación indicada.");
    }

    const wasReviewedByAdmin =
      Boolean(justification.reviewedByAdminId) ||
      Boolean(justification.adminComment);

    if (
      !wasReviewedByAdmin ||
      !["APPROVED", "REJECTED"].includes(justification.status)
    ) {
      throw new Error(
        "Solo se pueden eliminar justificaciones que ya estén aprobadas.",
      );
    }

    await this.repository.hideForWorker(justification.id, nowSqlDateTime());
  }

  async createMyJustification(
    user: AuthenticatedApiUser,
    input: CreateIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification> {
    const reason = input.reason.trim();
    if (!reason) {
      throw new Error("Debes indicar un motivo para justificar la incidencia.");
    }

    const record = await this.workdayRecordsRepository.findById(input.recordId);
    if (!record || record.userId !== user.userId) {
      throw new Error("No se encontró la incidencia indicada.");
    }

    if (record.status !== "INCIDENT" || !hasJustifiableIncident(record.incidentFlags)) {
      throw new Error("Esta incidencia no se puede justificar desde este flujo.");
    }

    const existing = await this.repository.findByRecordId(record.id);
    if (existing) {
      throw new Error("Esta incidencia ya tiene una justificación asociada.");
    }

    const now = nowSqlDateTime();
    const payload: CreateWorkdayIncidentJustificationInput = {
      id: `wij-${crypto.randomUUID()}`,
      recordId: record.id,
      userId: user.userId,
      reason,
      status: "PENDING_ADMIN",
      coordinatorComment: null,
      adminComment: null,
      reviewedByCoordinatorId: null,
      reviewedByAdminId: null,
      hiddenByWorkerAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.create(payload);
  }

  async listPendingForCoordinator(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayIncidentJustification[]> {
    if (!canReviewCoordinatorStep(user)) {
      throw new Error("FORBIDDEN");
    }

    return [];
  }

  async listPendingForAdmin(
    user: AuthenticatedApiUser,
  ): Promise<WorkdayIncidentJustification[]> {
    if (!canReviewAdminStep(user)) {
      throw new Error("FORBIDDEN");
    }

    const allowedUsers = await this.getAllowedUsersForManagement(user);
    return this.listScopedJustifications(allowedUsers, {});
  }

  async approveAsCoordinator(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification> {
    return this.reviewCoordinatorStep(user, input, "PENDING_ADMIN");
  }

  async rejectAsCoordinator(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification> {
    return this.reviewCoordinatorStep(user, input, "REJECTED");
  }

  async approveAsAdmin(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification> {
    return this.reviewAdminStep(user, input, "APPROVED");
  }

  async rejectAsAdmin(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
  ): Promise<WorkdayIncidentJustification> {
    return this.reviewAdminStep(user, input, "REJECTED");
  }

  private async reviewCoordinatorStep(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
    nextStatus: "PENDING_ADMIN" | "REJECTED",
  ): Promise<WorkdayIncidentJustification> {
    if (!canReviewCoordinatorStep(user)) {
      throw new Error("FORBIDDEN");
    }

    const justification = await this.getReviewableJustification(
      user,
      input.justificationId,
      "PENDING_COORDINATOR",
      { hoursOnly: true },
    );
    const comment = normalizeComment(input.comment);

    if (nextStatus === "REJECTED" && !comment) {
      throw new Error("Debes indicar un motivo para rechazar la justificación.");
    }

    return this.repository.updateReview({
      justificationId: justification.id,
      status: nextStatus,
      coordinatorComment: comment,
      reviewedByCoordinatorId: user.userId,
      updatedAt: nowSqlDateTime(),
    });
  }

  private async reviewAdminStep(
    user: AuthenticatedApiUser,
    input: ReviewIncidentJustificationInput,
    nextStatus: "APPROVED" | "REJECTED",
  ): Promise<WorkdayIncidentJustification> {
    if (!canReviewAdminStep(user)) {
      throw new Error("FORBIDDEN");
    }

    const justification = await this.getReviewableJustification(
      user,
      input.justificationId,
      ["PENDING_ADMIN", "PENDING_COORDINATOR"],
    );
    const comment = normalizeComment(input.comment);

    if (nextStatus === "REJECTED" && !comment) {
      throw new Error("Debes indicar un motivo para rechazar la justificación.");
    }

    return this.repository.updateReview({
      justificationId: justification.id,
      status: nextStatus,
      adminComment: comment,
      reviewedByAdminId: user.userId,
      updatedAt: nowSqlDateTime(),
    });
  }

  private async getReviewableJustification(
    user: AuthenticatedApiUser,
    justificationId: string,
    expectedStatus:
      | WorkdayIncidentJustification["status"]
      | WorkdayIncidentJustification["status"][],
    options?: { hoursOnly?: boolean },
  ): Promise<WorkdayIncidentJustification> {
    const allowedUsers = await this.getAllowedUsersForManagement(user);
    const allowedUserIds = new Set(allowedUsers.map((entry) => entry.id));
    const justification = await this.repository.findById(justificationId);

    if (!justification || !allowedUserIds.has(justification.userId)) {
      throw new Error("No se encontró la justificación indicada.");
    }

    const expectedStatuses = Array.isArray(expectedStatus)
      ? expectedStatus
      : [expectedStatus];

    if (!expectedStatuses.includes(justification.status)) {
      throw new Error("La justificación no está pendiente en este paso.");
    }

    const [justificationWithRecord] = await this.attachRecordDetails([
      justification,
    ]);

    if (!justificationWithRecord) {
      throw new Error("No se encontró la justificación indicada.");
    }

    if (
      options?.hoursOnly &&
      !hasHoursIncident(justificationWithRecord.incidentFlags ?? null)
    ) {
      throw new Error(
        "El coordinador solo puede revisar justificaciones relacionadas con horas.",
      );
    }

    return justificationWithRecord;
  }

  private async getAllowedUsersForManagement(
    user: AuthenticatedApiUser,
  ): Promise<Array<{ id: string; name: string; departmentId: string }>> {
    if (!canManageIncidentJustifications(user)) {
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

  private async listScopedJustifications(
    allowedUsers: Array<{ id: string; name: string }>,
    filters: WorkdayIncidentJustificationFilters,
    options?: { hoursOnly?: boolean },
  ): Promise<WorkdayIncidentJustification[]> {
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

    const itemsWithUsers = items.map((item) => ({
      ...item,
      userName: userNamesById.get(item.userId) ?? null,
    }));

    const enrichedItems = await this.attachRecordDetails(itemsWithUsers);

    if (options?.hoursOnly) {
      return enrichedItems.filter((item) =>
        hasHoursIncident(item.incidentFlags ?? null),
      );
    }

    return enrichedItems;
  }

  private async attachRecordDetails(
    items: WorkdayIncidentJustification[],
  ): Promise<WorkdayIncidentJustification[]> {
    if (items.length === 0) {
      return [];
    }

    const recordIds = Array.from(new Set(items.map((item) => item.recordId)));
    const records = await this.workdayRecordsRepository.listByIds(recordIds);
    const recordsById = new Map(
      records.map((record) => [record.id, record] as const),
    );

    return items.map((item) => {
      const record = recordsById.get(item.recordId);
      if (!record) {
        return item;
      }

      return {
        ...item,
        workDate: record.workDate,
        checkInAt: record.checkInAt,
        checkOutAt: record.checkOutAt,
        incidentFlags: record.incidentFlags,
        workedMinutes: record.workedMinutes,
      };
    });
  }
}

export const createWorkdayIncidentJustificationsService =
  (): WorkdayIncidentJustificationsService =>
    new WorkdayIncidentJustificationsServiceImpl();

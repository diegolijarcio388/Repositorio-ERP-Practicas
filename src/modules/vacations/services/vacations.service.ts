import { createDirectoryRepository } from "../repositories/directory.repository";
import { createVacationHistoryRepository } from "../repositories/vacation-history.repository";
import { createVacationRequestsRepository } from "../repositories/vacation-requests.repository";
import { createNotificationsRepository } from "../../notifications/repositories/notifications.repository";
import { createTimesheetAdapter } from "./timesheet-adapter";
import { validateVacationRequestDays } from "./vacation-validation.service";
import type {
  AuthenticatedApiUser,
  VacationHourRange,
  VacationRequestFilters,
  VacationRequestRecord,
} from "../domain/types";

const requestsRepository = createVacationRequestsRepository();
const historyRepository = createVacationHistoryRepository();
const directoryRepository = createDirectoryRepository();
const notificationsRepository = createNotificationsRepository();
const timesheetAdapter = createTimesheetAdapter();

const DAILY_HOURS = 8;
const VACATION_DAYS_POOL = 28;
const HOUR_BANK_POOL = 16;
const REQUEST_TITLE_MAX_LENGTH = 120;

const ACTIVE_STATUSES = new Set([
  "PENDING",
  "PENDING_ADMIN",
  "CHANGE_PENDING_COORDINATOR",
  "CHANGE_PENDING_ADMIN",
  "APPROVED",
]);

const timeToMinutes = (value: string): number => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) throw new Error("Formato de hora invalido. Usa HH:mm.");
  return Number(match[1]) * 60 + Number(match[2]);
};

const isActiveRequest = (request: VacationRequestRecord): boolean =>
  ACTIVE_STATUSES.has(request.status);

const computeUsedBalances = (
  requests: VacationRequestRecord[],
  options?: { excludeRequestId?: string },
) => {
  let usedDays = 0;
  let usedHours = 0;

  for (const request of requests) {
    if (options?.excludeRequestId && request.id === options.excludeRequestId) continue;
    if (!isActiveRequest(request)) continue;

    if (request.requestType === "HOURLY") {
      usedHours += request.hoursTotal;
      continue;
    }

    if (request.usesHourBank) {
      usedHours += request.hoursTotal || request.days.length * DAILY_HOURS;
      continue;
    }

    usedDays += request.days.length;
  }

  return { usedDays, usedHours };
};

const normalizeRequestTitle = (value?: string): string | null => {
  const title = value?.trim() ?? "";
  if (!title) return null;
  if (title.length > REQUEST_TITLE_MAX_LENGTH) {
    throw new Error(
      `El nombre de la solicitud no puede superar ${REQUEST_TITLE_MAX_LENGTH} caracteres.`,
    );
  }
  return title;
};

interface AdminManualCreationResult {
  created: VacationRequestRecord;
  targetUser: { id: string; name: string };
}

const createApprovedAdminRequest = async (
  adminUserId: string,
  targetUser: { id: string; name: string; departmentId: string },
  days: string[],
  comment: string | undefined,
  options?: { fixedByDepartment?: boolean; requestTitle?: string },
): Promise<AdminManualCreationResult> => {
  const existingRequests = await requestsRepository.listByUser(targetUser.id);
  const { usedDays } = computeUsedBalances(existingRequests);
  if (usedDays + days.length > VACATION_DAYS_POOL) {
    throw new Error(
      `No hay dias suficientes para ${targetUser.name}. Su saldo anual de ${VACATION_DAYS_POOL} dias se superaria.`,
    );
  }

  const created = await requestsRepository.create({
    userId: targetUser.id,
    departmentId: targetUser.departmentId,
    requestTitle: normalizeRequestTitle(options?.requestTitle),
    days,
    requestType: "FULL_DAY",
    hourRanges: [],
    hoursTotal: 0,
    usesHourBank: false,
    createdByAdmin: true,
    fixedByDepartment: Boolean(options?.fixedByDepartment),
  });
  const approved = await requestsRepository.updateStatus({
    id: created.id,
    status: "APPROVED",
    approverId: adminUserId,
    approverComment: comment,
  });
  await historyRepository.add({
    requestId: created.id,
    fromStatus: null,
    toStatus: "PENDING",
    changedBy: adminUserId,
    comment,
  });
  await historyRepository.add({
    requestId: created.id,
    fromStatus: "PENDING",
    toStatus: "APPROVED",
    changedBy: adminUserId,
    comment,
  });
  await timesheetAdapter.createVacationSuggestions({
    userId: approved.userId,
    days: approved.days,
    hoursPerDay: 8,
    sourceRequestId: approved.id,
  });
  return {
    created: approved,
    targetUser: { id: targetUser.id, name: targetUser.name },
  };
};

const normalizeFullDayRequest = async (
  user: AuthenticatedApiUser,
  requestId: string,
  inputDays: string[],
  usesHourBank: boolean,
  existingRequests: VacationRequestRecord[],
) => {
  const normalizedDays = await validateVacationRequestDays(
    user.userId,
    user.departmentId,
    inputDays,
    { excludeRequestId: requestId },
  );
  const { usedDays, usedHours } = computeUsedBalances(existingRequests, { excludeRequestId: requestId });
  const hoursTotal = usesHourBank ? normalizedDays.length * DAILY_HOURS : 0;

  if (usesHourBank) {
    if (usedHours + hoursTotal > HOUR_BANK_POOL) {
      throw new Error("No dispones de horas suficientes en la bolsa de 2 dias.");
    }
  } else if (usedDays + normalizedDays.length > VACATION_DAYS_POOL) {
    throw new Error("No dispones de dias suficientes en el contador de 28 dias.");
  }

  return { normalizedDays, hoursTotal };
};

const normalizeHourlyRequest = async (
  user: AuthenticatedApiUser,
  requestId: string,
  ranges: Array<{ day: string; startTime: string; endTime: string }>,
  existingRequests: VacationRequestRecord[],
) => {
  const hourRanges = normalizeHourRanges(ranges);
  const uniqueDays = [...new Set(hourRanges.map((range) => range.day))];
  const normalizedDays = await validateVacationRequestDays(
    user.userId,
    user.departmentId,
    uniqueDays,
    { excludeRequestId: requestId },
  );
  const hoursTotal = Number(hourRanges.reduce((acc, item) => acc + item.hours, 0).toFixed(2));
  const { usedHours } = computeUsedBalances(existingRequests, { excludeRequestId: requestId });
  if (usedHours + hoursTotal > HOUR_BANK_POOL) {
    throw new Error("No dispones de horas suficientes en la bolsa de 2 dias.");
  }
  return { normalizedDays, hourRanges, hoursTotal };
};

const normalizeHourRanges = (
  ranges: Array<{ day: string; startTime: string; endTime: string }>,
): VacationHourRange[] => {
  if (!ranges.length) throw new Error("Debes informar al menos un tramo horario.");

  const normalized = ranges.map((range) => {
    const day = range.day?.trim();
    if (!day) throw new Error("Cada tramo debe incluir un dia.");
    const start = timeToMinutes(range.startTime);
    const end = timeToMinutes(range.endTime);
    if (end <= start) throw new Error("La hora fin debe ser posterior a la hora inicio.");
    const hours = (end - start) / 60;
    if (hours > DAILY_HOURS) throw new Error("No se permite pedir mas de 8 horas por dia.");
    return {
      day,
      startTime: range.startTime,
      endTime: range.endTime,
      hours,
    };
  });

  const byDay = new Map<string, VacationHourRange[]>();
  for (const item of normalized) {
    const current = byDay.get(item.day) ?? [];
    current.push(item);
    byDay.set(item.day, current);
  }

  for (const [day, items] of byDay.entries()) {
    const sorted = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
    let dailyTotal = 0;
    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index];
      dailyTotal += current.hours;
      if (index === 0) continue;
      const previous = sorted[index - 1];
      if (current.startTime < previous.endTime) {
        throw new Error(`Hay tramos solapados el dia ${day}.`);
      }
    }
    if (dailyTotal > DAILY_HOURS) {
      throw new Error(`Se superan las 8 horas solicitadas el dia ${day}.`);
    }
  }

  return normalized;
};

export class VacationsService {
  private isCoordinatorForDepartment(user: AuthenticatedApiUser, departmentId: string): boolean {
    return user.coordinatorDepartmentIds.includes(departmentId);
  }

  private async getAllowedUsersForTimeControlManagement(
    user: AuthenticatedApiUser,
  ): Promise<Array<{ id: string; name: string }>> {
    if (user.role === "admin") {
      const allUsers = await directoryRepository.listAllUsers();
      return allUsers.map((entry) => ({ id: entry.id, name: entry.name }));
    }

    if (user.role !== "coordinator" && !user.canManageTimeControlRequests && !user.canManageVacations) {
      throw new Error("FORBIDDEN");
    }

    const departmentIds = new Set<string>(user.coordinatorDepartmentIds);
    if (departmentIds.size === 0) {
      departmentIds.add(user.departmentId);
    }

    const usersByDepartment = await Promise.all(
      Array.from(departmentIds).map((departmentId) =>
        directoryRepository.listByDepartment(departmentId),
      ),
    );

    return Array.from(
      new Map(
        usersByDepartment
          .flat()
          .map((entry) => [entry.id, { id: entry.id, name: entry.name }]),
      ).values(),
    );
  }

  private canUseCoordinatorFlow(user: AuthenticatedApiUser, departmentId: string): boolean {
    return (
      this.isCoordinatorForDepartment(user, departmentId) ||
      (user.role === "coordinator" && user.departmentId === departmentId)
    );
  }

  private sanitizeRequestForManagement(request: VacationRequestRecord): VacationRequestRecord {
    return {
      ...request,
      requestTitle: null,
    };
  }

  async getMyRequests(user: AuthenticatedApiUser): Promise<VacationRequestRecord[]> {
    return requestsRepository.listByUser(user.userId);
  }

  async createRequest(
    user: AuthenticatedApiUser,
    payload:
      | { type: "FULL_DAY"; days: string[]; usesHourBank?: boolean; requestTitle?: string }
      | {
          type: "HOURLY";
          ranges: Array<{ day: string; startTime: string; endTime: string }>;
          requestTitle?: string;
        },
  ) {
    const existingRequests = await requestsRepository.listByUser(user.userId);
    const { usedDays, usedHours } = computeUsedBalances(existingRequests);

    let normalizedDays: string[] = [];
    let requestType: "FULL_DAY" | "HOURLY" = payload.type;
    let hourRanges: VacationHourRange[] = [];
    let hoursTotal = 0;
    let usesHourBank = false;

    if (payload.type === "FULL_DAY") {
      normalizedDays = await validateVacationRequestDays(
        user.userId,
        user.departmentId,
        payload.days,
      );
      usesHourBank = Boolean(payload.usesHourBank);
      if (usesHourBank) {
        const neededHours = normalizedDays.length * DAILY_HOURS;
        if (usedHours + neededHours > HOUR_BANK_POOL) {
          throw new Error("No dispones de horas suficientes en la bolsa de 2 dias.");
        }
        hoursTotal = neededHours;
      } else if (usedDays + normalizedDays.length > VACATION_DAYS_POOL) {
        throw new Error("No dispones de dias suficientes en el contador de 28 dias.");
      }
    } else {
      hourRanges = normalizeHourRanges(payload.ranges);
      const uniqueDays = [...new Set(hourRanges.map((range) => range.day))];
      normalizedDays = await validateVacationRequestDays(
        user.userId,
        user.departmentId,
        uniqueDays,
      );
      hoursTotal = Number(hourRanges.reduce((acc, item) => acc + item.hours, 0).toFixed(2));
      if (usedHours + hoursTotal > HOUR_BANK_POOL) {
        throw new Error("No dispones de horas suficientes en la bolsa de 2 dias.");
      }
    }

    const created = await requestsRepository.create({
      userId: user.userId,
      departmentId: user.departmentId,
      requestTitle: normalizeRequestTitle(payload.requestTitle),
      days: normalizedDays,
      requestType,
      hourRanges,
      hoursTotal,
      usesHourBank,
      createdByAdmin: false,
    });
    await historyRepository.add({
      requestId: created.id,
      fromStatus: null,
      toStatus: "PENDING",
      changedBy: user.userId,
      comment: undefined,
    });

    const departmentUsers = await directoryRepository.listByDepartment(
      user.departmentId,
    );
    const coordinators = departmentUsers.filter((entry) => entry.role === "coordinator");
    await Promise.all(
      coordinators.map((coordinator) =>
        notificationsRepository.create({
          toUserId: coordinator.id,
          type: "VACATION_REQUEST_CREATED",
          payload: { requestId: created.id, userId: user.userId, days: created.days },
        }),
      ),
    );
    return created;
  }

  async editMyRequest(
    user: AuthenticatedApiUser,
    requestId: string,
    payload:
      | { type: "FULL_DAY"; days: string[]; comment?: string }
      | {
          type: "HOURLY";
          ranges: Array<{ day: string; startTime: string; endTime: string }>;
          comment?: string;
        },
  ): Promise<VacationRequestRecord> {
    const target = await requestsRepository.getById(requestId);
    if (!target) throw new Error("Solicitud no encontrada.");
    if (target.userId !== user.userId) throw new Error("No autorizado para editar esta solicitud.");
    if (
      target.status === "CHANGE_PENDING_COORDINATOR" ||
      target.status === "CHANGE_PENDING_ADMIN"
    ) {
      throw new Error("Ya existe una solicitud de cambio pendiente para esta solicitud.");
    }

    const existingRequests = await requestsRepository.listByUser(user.userId);
    let normalizedDays: string[] = [];
    let hourRanges: VacationHourRange[] = [];
    let hoursTotal = 0;
    if (target.requestType === "FULL_DAY") {
      if (payload.type !== "FULL_DAY") {
        throw new Error("La edicion debe respetar el tipo de solicitud original.");
      }
      const fullDay = await normalizeFullDayRequest(
        user,
        target.id,
        payload.days,
        target.usesHourBank,
        existingRequests,
      );
      normalizedDays = fullDay.normalizedDays;
      hoursTotal = fullDay.hoursTotal;
    } else {
      if (payload.type !== "HOURLY") {
        throw new Error("La edicion debe respetar el tipo de solicitud original.");
      }
      const hourly = await normalizeHourlyRequest(user, target.id, payload.ranges, existingRequests);
      normalizedDays = hourly.normalizedDays;
      hourRanges = hourly.hourRanges;
      hoursTotal = hourly.hoursTotal;
    }

    if (target.status === "PENDING") {
      const updated = await requestsRepository.updateRequestDays({
        id: target.id,
        requestTitle: target.requestTitle,
        days: normalizedDays,
        hourRanges,
        hoursTotal,
      });
      await historyRepository.add({
        requestId: target.id,
        fromStatus: "PENDING",
        toStatus: "PENDING",
        changedBy: user.userId,
        comment: "Edicion directa de solicitud pendiente.",
      });
      return updated;
    }

    if (target.status !== "PENDING_ADMIN" && target.status !== "APPROVED") {
      throw new Error("Solo se pueden editar solicitudes en PENDING, PENDING_ADMIN o APPROVED.");
    }

    const createdChange = await requestsRepository.markChangeRequest({
      id: target.id,
      proposedDays: normalizedDays,
      proposedHourRanges: target.requestType === "HOURLY" ? hourRanges : [],
      proposedHoursTotal: hoursTotal,
      comment: payload.comment,
      originStatus: target.status,
    });
    await historyRepository.add({
      requestId: target.id,
      fromStatus: target.status,
      toStatus: "CHANGE_PENDING_COORDINATOR",
      changedBy: user.userId,
      comment: payload.comment ?? "Solicitud de cambio enviada.",
    });

    const departmentUsers = await directoryRepository.listByDepartment(user.departmentId);
    const coordinators = departmentUsers.filter((entry) => entry.role === "coordinator");
    await Promise.all(
      coordinators.map((coordinator) =>
        notificationsRepository.create({
          toUserId: coordinator.id,
          type: "VACATION_CHANGE_REQUEST_CREATED",
          payload: {
            requestId: createdChange.id,
            userId: createdChange.userId,
            currentDays: target.days,
            proposedDays: normalizedDays,
            proposedHourRanges: target.requestType === "HOURLY" ? hourRanges : [],
            comment: payload.comment ?? null,
          },
        }),
      ),
    );
    return createdChange;
  }

  async listDepartmentRequests(
    user: AuthenticatedApiUser,
    filters: VacationRequestFilters,
  ): Promise<VacationRequestRecord[]> {
    const selectedDepartmentId =
      filters.departmentId ??
      user.coordinatorDepartmentIds[0] ??
      user.departmentId;
    const canReadSelectedDepartment =
      user.role === "admin" || user.canManageVacations || this.canUseCoordinatorFlow(user, selectedDepartmentId);
    if (!canReadSelectedDepartment) {
      throw new Error("No autorizado para consultar este departamento.");
    }
    const items = await requestsRepository.listFiltered({
      ...filters,
      departmentId: selectedDepartmentId,
    });
    return items.map((item) => this.sanitizeRequestForManagement(item));
  }

  async cancelMyRequest(
    user: AuthenticatedApiUser,
    requestId: string,
    comment?: string,
  ): Promise<VacationRequestRecord> {
    const target = await requestsRepository.getById(requestId);
    if (!target) throw new Error("Solicitud no encontrada.");
    if (target.userId !== user.userId) {
      throw new Error("No autorizado para cancelar esta solicitud.");
    }
    if (target.status === "CANCELLED") {
      throw new Error("La solicitud ya esta cancelada.");
    }
    if (target.status === "REJECTED") {
      throw new Error("No se puede cancelar una solicitud rechazada.");
    }
    if (
      target.status !== "PENDING" &&
      target.status !== "PENDING_ADMIN" &&
      target.status !== "CHANGE_PENDING_COORDINATOR" &&
      target.status !== "CHANGE_PENDING_ADMIN" &&
      target.status !== "APPROVED"
    ) {
      throw new Error(
        "Solo se pueden cancelar solicitudes en estado PENDING, PENDING_ADMIN, CHANGE_PENDING_COORDINATOR, CHANGE_PENDING_ADMIN o APPROVED.",
      );
    }

    const updated = await requestsRepository.updateStatus({
      id: requestId,
      status: "CANCELLED",
      approverId: user.userId,
      approverComment: comment,
    });
    await historyRepository.add({
      requestId,
      fromStatus: target.status,
      toStatus: "CANCELLED",
      changedBy: user.userId,
      comment,
    });

    const departmentUsers = await directoryRepository.listByDepartment(user.departmentId);
    const coordinators = departmentUsers.filter((entry) => entry.role === "coordinator");
    await Promise.all(
      coordinators.map((coordinator) =>
        notificationsRepository.create({
          toUserId: coordinator.id,
          type: "VACATION_REQUEST_CANCELLED",
          payload: {
            requestId: updated.id,
            userId: updated.userId,
            days: updated.days,
            comment: comment ?? null,
          },
        }),
      ),
    );

    return updated;
  }

  async deleteMyCancelledRequest(
    user: AuthenticatedApiUser,
    requestId: string,
  ): Promise<void> {
    const target = await requestsRepository.getById(requestId);
    if (!target) throw new Error("Solicitud no encontrada.");
    if (target.userId !== user.userId) {
      throw new Error("No autorizado para eliminar esta solicitud.");
    }
    if (target.status !== "CANCELLED") {
      throw new Error("Solo se pueden eliminar solicitudes canceladas.");
    }
    await historyRepository.deleteByRequestId(requestId);
    await requestsRepository.deleteById(requestId);
  }

  async deleteCancelledRequestAsManager(
    user: AuthenticatedApiUser,
    requestId: string,
  ): Promise<void> {
    const target = await requestsRepository.getById(requestId);
    if (!target) throw new Error("Solicitud no encontrada.");
    if (target.status !== "CANCELLED") {
      throw new Error("Solo se pueden eliminar solicitudes canceladas.");
    }
    if (user.role !== "admin" && !user.canManageVacations && !this.canUseCoordinatorFlow(user, target.departmentId)) {
      throw new Error("Rol no autorizado para eliminar solicitudes.");
    }

    await historyRepository.deleteByRequestId(requestId);
    await requestsRepository.deleteById(requestId);
  }

  async approveRequest(
    user: AuthenticatedApiUser,
    requestId: string,
    comment?: string,
  ): Promise<VacationRequestRecord> {
    const target = await requestsRepository.getById(requestId);
    if (!target) throw new Error("Solicitud no encontrada.");

    if (this.canUseCoordinatorFlow(user, target.departmentId)) {
      if (target.status === "PENDING") {
        const updated = await requestsRepository.updateStatus({
          id: requestId,
          status: "PENDING_ADMIN",
          approverId: user.userId,
          approverComment: comment,
        });
        await historyRepository.add({
          requestId,
          fromStatus: "PENDING",
          toStatus: "PENDING_ADMIN",
          changedBy: user.userId,
          comment,
        });
        const admins = await directoryRepository.listAdmins();
        await Promise.all(
          admins.map((admin) =>
            notificationsRepository.create({
              toUserId: admin.id,
              type: "VACATION_REQUEST_PENDING_ADMIN",
              payload: {
                requestId: updated.id,
                userId: updated.userId,
                departmentId: updated.departmentId,
                days: updated.days,
                comment: comment ?? null,
              },
            }),
          ),
        );
        await notificationsRepository.create({
          toUserId: updated.userId,
          type: "VACATION_REQUEST_COORDINATOR_APPROVED",
          payload: { requestId: updated.id, comment: comment ?? null },
        });
        return updated;
      }
      if (target.status === "CHANGE_PENDING_COORDINATOR") {
        const updated = await requestsRepository.promoteChangeToAdmin({
          id: requestId,
          approverId: user.userId,
          approverComment: comment,
        });
        await historyRepository.add({
          requestId,
          fromStatus: "CHANGE_PENDING_COORDINATOR",
          toStatus: "CHANGE_PENDING_ADMIN",
          changedBy: user.userId,
          comment,
        });
        const admins = await directoryRepository.listAdmins();
        await Promise.all(
          admins.map((admin) =>
            notificationsRepository.create({
              toUserId: admin.id,
              type: "VACATION_CHANGE_REQUEST_PENDING_ADMIN",
              payload: {
                requestId: updated.id,
                userId: updated.userId,
                currentDays: updated.days,
                proposedDays: updated.proposedDays ?? [],
                comment: comment ?? null,
              },
            }),
          ),
        );
        await notificationsRepository.create({
          toUserId: updated.userId,
          type: "VACATION_CHANGE_REQUEST_COORDINATOR_APPROVED",
          payload: { requestId: updated.id, comment: comment ?? null },
        });
        return updated;
      }
      throw new Error(
        "El coordinador solo puede aprobar solicitudes en estado PENDING o CHANGE_PENDING_COORDINATOR.",
      );
    }

    if (user.role === "admin" || user.canManageVacations) {
      if (target.status === "PENDING_ADMIN") {
        const updated = await requestsRepository.updateStatus({
          id: requestId,
          status: "APPROVED",
          approverId: user.userId,
          approverComment: comment,
        });
        await historyRepository.add({
          requestId,
          fromStatus: "PENDING_ADMIN",
          toStatus: "APPROVED",
          changedBy: user.userId,
          comment,
        });
        await notificationsRepository.create({
          toUserId: updated.userId,
          type: "VACATION_REQUEST_APPROVED",
          payload: { requestId: updated.id, comment: comment ?? null },
        });
        await timesheetAdapter.createVacationSuggestions({
          userId: updated.userId,
          days: updated.days,
          hoursPerDay: 8,
          sourceRequestId: updated.id,
        });
        return updated;
      }
      if (target.status === "CHANGE_PENDING_ADMIN") {
        const proposedDays = target.proposedDays ?? [];
        const proposedHourRanges = target.proposedHourRanges ?? [];
        const proposedHoursTotal = target.proposedHoursTotal ?? 0;
        if (proposedDays.length === 0 && target.requestType === "FULL_DAY") {
          throw new Error("No hay dias propuestos para aplicar el cambio.");
        }
        const hoursTotal =
          target.requestType === "HOURLY"
            ? proposedHoursTotal
            : target.usesHourBank
              ? proposedDays.length * DAILY_HOURS
              : 0;
        const updated = await requestsRepository.applyApprovedChange({
          id: requestId,
          days: proposedDays,
          hourRanges: target.requestType === "HOURLY" ? proposedHourRanges : [],
          hoursTotal,
          approverId: user.userId,
          approverComment: comment,
        });
        await historyRepository.add({
          requestId,
          fromStatus: "CHANGE_PENDING_ADMIN",
          toStatus: "APPROVED",
          changedBy: user.userId,
          comment,
        });
        await notificationsRepository.create({
          toUserId: updated.userId,
          type: "VACATION_CHANGE_REQUEST_APPROVED",
          payload: { requestId: updated.id, comment: comment ?? null, days: updated.days },
        });
        await timesheetAdapter.createVacationSuggestions({
          userId: updated.userId,
          days: updated.days,
          hoursPerDay: 8,
          sourceRequestId: updated.id,
        });
        return updated;
      }
      throw new Error(
        "El admin solo puede aprobar solicitudes en estado PENDING_ADMIN o CHANGE_PENDING_ADMIN.",
      );
    }

    throw new Error("Rol no autorizado para aprobar solicitudes.");
  }

  async rejectRequest(
    user: AuthenticatedApiUser,
    requestId: string,
  comment?: string,
  ): Promise<VacationRequestRecord> {
    const target = await requestsRepository.getById(requestId);
    if (!target) throw new Error("Solicitud no encontrada.");
    if (this.canUseCoordinatorFlow(user, target.departmentId) || user.canManageVacations) {
      if (target.status === "PENDING") {
        const updated = await requestsRepository.updateStatus({
          id: requestId,
          status: "REJECTED",
          approverId: user.userId,
          approverComment: comment,
        });
        await historyRepository.add({
          requestId,
          fromStatus: "PENDING",
          toStatus: "REJECTED",
          changedBy: user.userId,
          comment,
        });
        await notificationsRepository.create({
          toUserId: updated.userId,
          type: "VACATION_REQUEST_REJECTED",
          payload: { requestId: updated.id, comment: comment ?? null },
        });
        return updated;
      }
      if (target.status === "CHANGE_PENDING_COORDINATOR") {
        const restoreStatus = target.changeOriginStatus ?? "APPROVED";
        const updated = await requestsRepository.clearChangeRequest({
          id: requestId,
          status: restoreStatus,
          approverId: user.userId,
          approverComment: comment,
        });
        await historyRepository.add({
          requestId,
          fromStatus: "CHANGE_PENDING_COORDINATOR",
          toStatus: restoreStatus,
          changedBy: user.userId,
          comment,
        });
        await notificationsRepository.create({
          toUserId: updated.userId,
          type: "VACATION_CHANGE_REQUEST_REJECTED",
          payload: { requestId: updated.id, comment: comment ?? null },
        });
        return updated;
      }
      throw new Error(
        "El coordinador solo puede rechazar solicitudes en estado PENDING o CHANGE_PENDING_COORDINATOR.",
      );
    }

    if (user.role === "admin") {
      if (target.status === "PENDING_ADMIN") {
        const updated = await requestsRepository.updateStatus({
          id: requestId,
          status: "REJECTED",
          approverId: user.userId,
          approverComment: comment,
        });
        await historyRepository.add({
          requestId,
          fromStatus: "PENDING_ADMIN",
          toStatus: "REJECTED",
          changedBy: user.userId,
          comment,
        });
        await notificationsRepository.create({
          toUserId: updated.userId,
          type: "VACATION_REQUEST_REJECTED",
          payload: { requestId: updated.id, comment: comment ?? null },
        });
        return updated;
      }
      if (target.status === "CHANGE_PENDING_ADMIN") {
        const restoreStatus = target.changeOriginStatus ?? "APPROVED";
        const updated = await requestsRepository.clearChangeRequest({
          id: requestId,
          status: restoreStatus,
          approverId: user.userId,
          approverComment: comment,
        });
        await historyRepository.add({
          requestId,
          fromStatus: "CHANGE_PENDING_ADMIN",
          toStatus: restoreStatus,
          changedBy: user.userId,
          comment,
        });
        await notificationsRepository.create({
          toUserId: updated.userId,
          type: "VACATION_CHANGE_REQUEST_REJECTED",
          payload: { requestId: updated.id, comment: comment ?? null },
        });
        return updated;
      }
      throw new Error(
        "El admin solo puede rechazar solicitudes en estado PENDING_ADMIN o CHANGE_PENDING_ADMIN.",
      );
    }

    throw new Error("Rol no autorizado para rechazar solicitudes.");
  }

  async listAdmin(filters: VacationRequestFilters): Promise<VacationRequestRecord[]> {
    const items = await requestsRepository.listFiltered(filters);
    return items.map((item) => this.sanitizeRequestForManagement(item));
  }

  async listApprovedVacationUsersForTimeControlDate(
    user: AuthenticatedApiUser,
    date: string,
  ): Promise<Array<{ id: string; name: string }>> {
    const allowedUsers = await this.getAllowedUsersForTimeControlManagement(user);
    if (!allowedUsers.length) {
      return [];
    }

    const requests = await requestsRepository.listFiltered({
      status: "APPROVED",
      userIds: allowedUsers.map((entry) => entry.id),
      dateFrom: date,
      dateTo: date,
    });

    const vacationUserIds = new Set(
      requests
        .filter((request) => request.requestType === "FULL_DAY" && request.days.includes(date))
        .map((request) => request.userId),
    );

    return allowedUsers
      .filter((entry) => vacationUserIds.has(entry.id))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async createManualByAdmin(
    user: AuthenticatedApiUser,
    payload: { userId: string; days: string[]; comment?: string; requestTitle?: string },
  ): Promise<VacationRequestRecord> {
    const target = await directoryRepository.findUserById(payload.userId);
    if (!target) throw new Error("Usuario objetivo no encontrado.");
    const normalizedDays = await validateVacationRequestDays(
      target.id,
      target.departmentId,
      payload.days,
    );
    const { created: approved } = await createApprovedAdminRequest(
      user.userId,
      { id: target.id, name: target.name, departmentId: target.departmentId },
      normalizedDays,
      payload.comment,
      { requestTitle: payload.requestTitle },
    );
    await notificationsRepository.create({
      toUserId: target.id,
      type: "VACATION_MANUAL_CREATED",
      payload: { requestId: approved.id, comment: payload.comment ?? null },
    });
    return approved;
  }

  async createDepartmentFixedByAdmin(
    user: AuthenticatedApiUser,
    payload: { departmentId: string; days: string[]; comment?: string; userIds?: string[] },
  ): Promise<{
    created: Array<{ requestId: string; userId: string; userName: string; days: string[] }>;
    skipped: Array<{ userId: string; userName: string; reason: string }>;
  }> {
    const departmentUsers = await directoryRepository.listByDepartment(payload.departmentId);
    const availableTargets = departmentUsers.filter((entry) => entry.role !== "admin");
    if (!availableTargets.length) {
      throw new Error("No hay usuarios disponibles en el departamento seleccionado.");
    }
    const selectedUserIds = (payload.userIds ?? []).filter(Boolean);
    let targets = availableTargets;
    if (selectedUserIds.length > 0) {
      const availableTargetIds = new Set(availableTargets.map((entry) => entry.id));
      const invalidSelectedIds = selectedUserIds.filter((id) => !availableTargetIds.has(id));
      if (invalidSelectedIds.length > 0) {
        throw new Error("Hay trabajadores seleccionados que no pertenecen al departamento.");
      }
      const selectedSet = new Set(selectedUserIds);
      targets = availableTargets.filter((entry) => selectedSet.has(entry.id));
    }
    if (!targets.length) {
      throw new Error("Selecciona al menos un trabajador del departamento.");
    }

    const created: Array<{ requestId: string; userId: string; userName: string; days: string[] }> = [];
    const skipped: Array<{ userId: string; userName: string; reason: string }> = [];

    for (const target of targets) {
      try {
        const normalizedDays = await validateVacationRequestDays(
          target.id,
          target.departmentId,
          payload.days,
        );
        const result = await createApprovedAdminRequest(
          user.userId,
          { id: target.id, name: target.name, departmentId: target.departmentId },
          normalizedDays,
          payload.comment,
          {
            fixedByDepartment: true,
            requestTitle: "Vacaciones de departamento",
          },
        );
        await notificationsRepository.create({
          toUserId: target.id,
          type: "VACATION_DEPARTMENT_FIXED_CREATED",
          payload: {
            requestId: result.created.id,
            departmentId: payload.departmentId,
            days: normalizedDays,
            comment: payload.comment ?? null,
          },
        });
        created.push({
          requestId: result.created.id,
          userId: target.id,
          userName: target.name,
          days: normalizedDays,
        });
      } catch (error) {
        skipped.push({
          userId: target.id,
          userName: target.name,
          reason: error instanceof Error ? error.message : "Error desconocido al marcar dias.",
        });
      }
    }

    return { created, skipped };
  }
}

export const createVacationsService = () => new VacationsService();

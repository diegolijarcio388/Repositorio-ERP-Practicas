import { createCalendarEventsRepository } from "../../calendar/repositories/calendar-events.repository";
import { createVacationBlocksRepository } from "../repositories/vacation-blocks.repository";
import { createVacationRequestsRepository } from "../repositories/vacation-requests.repository";
import { expandDateRangeToDays, getDateBounds, normalizeDays } from "./date-helpers";
import type {
  CalendarEventRecord,
  VacationBlockRecord,
  VacationRequestRecord,
} from "../domain/types";

export interface VacationValidationDeps {
  listBlocksByDepartment: (departmentId: string) => Promise<VacationBlockRecord[]>;
  listCalendarEvents: (input: {
    departmentId: string;
    dateFrom: string;
    dateTo: string;
  }) => Promise<CalendarEventRecord[]>;
  listRequestsByUser: (userId: string) => Promise<VacationRequestRecord[]>;
}

const defaultDeps: VacationValidationDeps = {
  listBlocksByDepartment: (departmentId: string) =>
    createVacationBlocksRepository().listByDepartment(departmentId),
  listCalendarEvents: (input) =>
    createCalendarEventsRepository().listFiltered(input),
  listRequestsByUser: (userId: string) =>
    createVacationRequestsRepository().listFiltered({ userId }),
};

export const createVacationValidationService = (deps: VacationValidationDeps) => {
  const buildBlockedDaysSet = async (
    departmentId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<Set<string>> => {
    const blocked = new Set<string>();

    const blocks = await deps.listBlocksByDepartment(departmentId);
    for (const block of blocks) {
      if (block.days?.length) {
        for (const day of block.days) {
          if (day >= dateFrom && day <= dateTo) blocked.add(day);
        }
      }
      if (block.startDate && block.endDate) {
        for (const day of expandDateRangeToDays(block.startDate, block.endDate)) {
          if (day >= dateFrom && day <= dateTo) blocked.add(day);
        }
      }
    }

    const events = await deps.listCalendarEvents({
      departmentId,
      dateFrom,
      dateTo,
    });
    for (const event of events) {
      const shouldBlock =
        event.type === "HOLIDAY" || (event.type === "EVENT" && event.blocksSelection);
      if (!shouldBlock) continue;

      const days =
        event.days?.length
          ? normalizeDays(event.days)
          : event.startDate && event.endDate
            ? expandDateRangeToDays(event.startDate, event.endDate)
            : [];
      for (const day of days) {
        if (day >= dateFrom && day <= dateTo) blocked.add(day);
      }
    }

    return blocked;
  };

  const validateVacationRequestDays = async (
    userId: string,
    departmentId: string,
    daysInput: string[],
    options?: { excludeRequestId?: string },
  ): Promise<string[]> => {
    const days = normalizeDays(daysInput);
    const bounds = getDateBounds(days);
    const blockedDays = await buildBlockedDaysSet(
      departmentId,
      bounds.from,
      bounds.to,
    );
    const intersection = days.filter((day) => blockedDays.has(day));
    if (intersection.length > 0) {
      throw new Error(
        `Los dias seleccionados estan bloqueados: ${intersection.join(", ")}`,
      );
    }

    const existing = await deps.listRequestsByUser(userId);
    const taken = new Set<string>();
    for (const request of existing) {
      if (
        request.status !== "PENDING" &&
        request.status !== "PENDING_ADMIN" &&
        request.status !== "CHANGE_PENDING_COORDINATOR" &&
        request.status !== "CHANGE_PENDING_ADMIN" &&
        request.status !== "APPROVED"
      ) {
        continue;
      }
      if (options?.excludeRequestId && request.id === options.excludeRequestId) continue;
      for (const day of request.days) taken.add(day);
    }
    const overlaps = days.filter((day) => taken.has(day));
    if (overlaps.length > 0) {
      throw new Error(`Ya tienes dias solicitados o aprobados: ${overlaps.join(", ")}`);
    }
    return days;
  };

  return {
    buildBlockedDaysSet,
    validateVacationRequestDays,
  };
};

const validationService = createVacationValidationService(defaultDeps);

export const buildBlockedDaysSet = validationService.buildBlockedDaysSet;
export const validateVacationRequestDays = validationService.validateVacationRequestDays;

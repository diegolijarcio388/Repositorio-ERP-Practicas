import { createCalendarEventsRepository } from "../repositories/calendar-events.repository";
import { expandDateRangeToDays, normalizeDays } from "../../vacations/services/date-helpers";
import type {
  AuthenticatedApiUser,
  CalendarEventRecord,
} from "../../vacations/domain/types";

const repository = createCalendarEventsRepository();

export class CalendarEventsService {
  async list(input: { dateFrom?: string; dateTo?: string; departmentId?: string }) {
    return repository.listFiltered(input);
  }

  async create(
    user: AuthenticatedApiUser,
    payload: {
      title: string;
      description?: string;
      type: "HOLIDAY" | "EVENT";
      scope: "GLOBAL" | "DEPARTMENT";
      departmentId?: string;
      days?: string[];
      startDate?: string;
      endDate?: string;
      allDay?: boolean;
      blocksSelection?: boolean;
    },
  ): Promise<CalendarEventRecord> {
    if ((!payload.days || payload.days.length === 0) && !(payload.startDate && payload.endDate)) {
      throw new Error("Debe informar days[] o startDate/endDate.");
    }
    const days =
      payload.days?.length
        ? normalizeDays(payload.days)
        : payload.startDate && payload.endDate
          ? expandDateRangeToDays(payload.startDate, payload.endDate)
          : null;

    return repository.upsert({
      title: payload.title,
      description: payload.description,
      type: payload.type,
      scope: payload.scope,
      departmentId: payload.scope === "DEPARTMENT" ? payload.departmentId : null,
      days,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      allDay: payload.allDay ?? true,
      blocksSelection: payload.blocksSelection ?? false,
      createdBy: user.userId,
    });
  }

  async update(
    id: string,
    payload: {
      title: string;
      description?: string;
      type: "HOLIDAY" | "EVENT";
      scope: "GLOBAL" | "DEPARTMENT";
      departmentId?: string;
      days?: string[];
      startDate?: string;
      endDate?: string;
      allDay?: boolean;
      blocksSelection?: boolean;
    },
  ) {
    const current = await repository.getById(id);
    if (!current) throw new Error("Evento no encontrado.");
    const days =
      payload.days?.length
        ? normalizeDays(payload.days)
        : payload.startDate && payload.endDate
          ? expandDateRangeToDays(payload.startDate, payload.endDate)
          : null;
    return repository.upsert({
      id,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      scope: payload.scope,
      departmentId: payload.scope === "DEPARTMENT" ? payload.departmentId : null,
      days,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      allDay: payload.allDay ?? true,
      blocksSelection: payload.blocksSelection ?? false,
      createdBy: current.createdBy,
    });
  }

  async delete(id: string): Promise<void> {
    await repository.deleteById(id);
  }
}

export const createCalendarEventsService = () => new CalendarEventsService();

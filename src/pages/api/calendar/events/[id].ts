import type { APIRoute } from "astro";
import {
  parseJsonBody,
  withApiError,
} from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import {
  ensureRole,
  requireApiUser,
} from "../../../../modules/rbac/services/api-auth";
import { createCalendarEventsService } from "../../../../modules/calendar/services/calendar-events.service";

const calendarService = createCalendarEventsService();

export const PATCH: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin"]);
  const id = context.params.id;
  if (!id) throw new Error("id requerido");
  const body = await parseJsonBody<{
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
  }>(context.request);
  const item = await calendarService.update(id, body);
  return jsonOk({ item });
});

export const DELETE: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin"]);
  const id = context.params.id;
  if (!id) throw new Error("id requerido");
  await calendarService.delete(id);
  return jsonOk({ ok: true });
});

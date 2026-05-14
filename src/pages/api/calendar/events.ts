import type { APIRoute } from "astro";
import {
  parseJsonBody,
  withApiError,
} from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import {
  ensureRole,
  requireApiUser,
} from "../../../modules/rbac/services/api-auth";
import { createCalendarEventsService } from "../../../modules/calendar/services/calendar-events.service";

const calendarService = createCalendarEventsService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const dateFrom = context.url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = context.url.searchParams.get("dateTo") ?? undefined;
  const departmentId =
    user.role === "admin"
      ? context.url.searchParams.get("departmentId") ?? undefined
      : user.departmentId;
  const items = await calendarService.list({ dateFrom, dateTo, departmentId });
  return jsonOk({ items });
});

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin"]);
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
  const item = await calendarService.create(user, body);
  return jsonOk({ item }, 201);
});

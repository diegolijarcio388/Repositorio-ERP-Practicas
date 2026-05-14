import type { APIRoute } from "astro";
import { jsonOk } from "../../../core/server/api-response";
import { withApiError } from "../../../core/server/api-handler";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createTimeControlService } from "../../../modules/time-control/services/time-control.service";

const timeControlService = createTimeControlService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const userId = context.url.searchParams.get("userId") ?? undefined;
  const dateFrom = context.url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = context.url.searchParams.get("dateTo") ?? undefined;

  const items = await timeControlService.getIncidents(user, {
    userId,
    dateFrom,
    dateTo,
  });

  return jsonOk({ items });
});

import type { APIRoute } from "astro";
import { jsonOk } from "../../../../core/server/api-response";
import { withApiError } from "../../../../core/server/api-handler";
import { requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createWorkdayAdjustmentsService } from "../../../../modules/time-control/services/workday-adjustments.service";

const workdayAdjustmentsService = createWorkdayAdjustmentsService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const items = await workdayAdjustmentsService.getMyRequests(user);
  return jsonOk({ items });
});

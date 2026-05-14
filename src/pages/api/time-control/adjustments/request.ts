import type { APIRoute } from "astro";
import { jsonOk } from "../../../../core/server/api-response";
import { withApiError } from "../../../../core/server/api-handler";
import { requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createWorkdayAdjustmentsService } from "../../../../modules/time-control/services/workday-adjustments.service";

const workdayAdjustmentsService = createWorkdayAdjustmentsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await context.request.json();

  const item = await workdayAdjustmentsService.createRequest(user, {
    requestType: body?.requestType,
    requestedTime: body?.requestedTime,
    reason: body?.reason ?? "",
    requestedLatitude:
      body?.requestedLatitude === undefined
        ? null
        : Number(body.requestedLatitude),
    requestedLongitude:
      body?.requestedLongitude === undefined
        ? null
        : Number(body.requestedLongitude),
  });

  return jsonOk({ item });
});

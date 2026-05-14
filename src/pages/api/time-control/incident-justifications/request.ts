import type { APIRoute } from "astro";
import { jsonOk } from "../../../../core/server/api-response";
import { withApiError } from "../../../../core/server/api-handler";
import { requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createWorkdayIncidentJustificationsService } from "../../../../modules/time-control/services/workday-incident-justifications.service";

const workdayIncidentJustificationsService =
  createWorkdayIncidentJustificationsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await context.request.json();

  const item = await workdayIncidentJustificationsService.createMyJustification(
    user,
    {
      recordId: body?.recordId,
      reason: body?.reason ?? "",
    },
  );

  return jsonOk({ item });
});

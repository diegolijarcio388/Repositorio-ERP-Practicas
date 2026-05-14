import type { APIRoute } from "astro";
import { withApiError } from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import { requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createWorkdayIncidentJustificationsService } from "../../../../modules/time-control/services/workday-incident-justifications.service";

const workdayIncidentJustificationsService =
  createWorkdayIncidentJustificationsService();

export const DELETE: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const id = context.params.id;

  if (!id) {
    throw new Error("ID de justificación requerido.");
  }

  await workdayIncidentJustificationsService.deleteMyJustification(user, id);
  return jsonOk({ ok: true });
});

import type { APIRoute } from "astro";
import { jsonOk } from "../../../../../core/server/api-response";
import { withApiError } from "../../../../../core/server/api-handler";
import { requireApiUser } from "../../../../../modules/rbac/services/api-auth";
import { createWorkdayIncidentJustificationsService } from "../../../../../modules/time-control/services/workday-incident-justifications.service";

const workdayIncidentJustificationsService =
  createWorkdayIncidentJustificationsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const justificationId = context.params.id;

  if (!justificationId) {
    throw new Error("No se indicó la justificación a revisar.");
  }

  const body = await context.request.json();
  const status = body?.status;
  const comment = body?.comment ?? null;

  if (status !== "APPROVED" && status !== "REJECTED") {
    throw new Error("El estado de revisión no es válido.");
  }

  const item =
    status === "APPROVED"
      ? await workdayIncidentJustificationsService.approveAsAdmin(user, {
          justificationId,
          comment,
        })
      : await workdayIncidentJustificationsService.rejectAsAdmin(user, {
          justificationId,
          comment,
        });

  return jsonOk({ item });
});

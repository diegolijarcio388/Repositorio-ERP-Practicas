import type { APIRoute } from "astro";
import { withApiError } from "../../../../../core/server/api-handler";
import { jsonOk } from "../../../../../core/server/api-response";
import { requireApiUser } from "../../../../../modules/rbac/services/api-auth";
import { createTimeControlService } from "../../../../../modules/time-control/services/time-control.service";

const timeControlService = createTimeControlService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const recordId = context.params.id;

  if (!recordId) {
    throw new Error("Falta el identificador del fichaje.");
  }

  const body = await context.request.json();
  const status = body?.status === "REJECTED" ? "REJECTED" : "APPROVED";
  const comment =
    typeof body?.comment === "string" ? body.comment : null;

  const item = await timeControlService.reviewAdminValidation(
    user,
    recordId,
    status,
    comment,
  );

  return jsonOk({ item });
});

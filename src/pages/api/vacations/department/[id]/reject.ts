import type { APIRoute } from "astro";
import {
  parseJsonBody,
  withApiError,
} from "../../../../../core/server/api-handler";
import { jsonOk } from "../../../../../core/server/api-response";
import {
  ensureRole,
  requireApiUser,
} from "../../../../../modules/rbac/services/api-auth";
import { createVacationsService } from "../../../../../modules/vacations/services/vacations.service";

const vacationsService = createVacationsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["coordinator", "admin"]);
  const body = await parseJsonBody<{ comment?: string }>(context.request);
  const id = context.params.id;
  if (!id) throw new Error("id requerido");
  const updated = await vacationsService.rejectRequest(user, id, body.comment);
  return jsonOk({ item: updated });
});

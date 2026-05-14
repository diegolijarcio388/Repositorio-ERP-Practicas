import type { APIRoute } from "astro";
import { withApiError } from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import { ensureRole, requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createVacationsService } from "../../../../modules/vacations/services/vacations.service";

const vacationsService = createVacationsService();

export const DELETE: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["coordinator", "admin"]);
  const id = context.params.id;
  if (!id) throw new Error("ID de solicitud requerido.");

  await vacationsService.deleteCancelledRequestAsManager(user, id);
  return jsonOk({ ok: true });
});

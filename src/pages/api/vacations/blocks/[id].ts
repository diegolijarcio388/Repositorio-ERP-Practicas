import type { APIRoute } from "astro";
import { withApiError } from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import {
  ensureRole,
  requireApiUser,
} from "../../../../modules/rbac/services/api-auth";
import { createVacationBlocksService } from "../../../../modules/vacations/services/vacation-blocks.service";

const blocksService = createVacationBlocksService();

export const DELETE: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["coordinator", "admin"]);
  const id = context.params.id;
  if (!id) throw new Error("id requerido");
  await blocksService.delete(id);
  return jsonOk({ ok: true });
});

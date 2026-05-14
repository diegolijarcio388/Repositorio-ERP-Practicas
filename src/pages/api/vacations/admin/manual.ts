import type { APIRoute } from "astro";
import {
  parseJsonBody,
  withApiError,
} from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import {
  ensureRole,
  requireApiUser,
} from "../../../../modules/rbac/services/api-auth";
import { createVacationsService } from "../../../../modules/vacations/services/vacations.service";

const vacationsService = createVacationsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin"]);
  const body = await parseJsonBody<{
    userId: string;
    days: string[];
    comment?: string;
    requestTitle?: string;
  }>(context.request);
  const item = await vacationsService.createManualByAdmin(user, body);
  return jsonOk({ item }, 201);
});

import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createVacationsService } from "../../../modules/vacations/services/vacations.service";

const vacationsService = createVacationsService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const requests = await vacationsService.getMyRequests(user);
  return jsonOk({ items: requests });
});

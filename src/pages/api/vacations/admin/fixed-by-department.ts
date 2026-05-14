import type { APIRoute } from "astro";
import { parseJsonBody, withApiError } from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import { ensureRole, requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createVacationsService } from "../../../../modules/vacations/services/vacations.service";

const vacationsService = createVacationsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin"]);
  const body = await parseJsonBody<{
    departmentId: string;
    days: string[];
    comment?: string;
    userIds?: string[];
  }>(context.request);
  const result = await vacationsService.createDepartmentFixedByAdmin(user, body);
  return jsonOk({ ...result }, 201);
});

import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createPermissionsService } from "../../../modules/permissions/services/permissions.service";

const permissionsService = createPermissionsService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const items = await permissionsService.listPendingForCoordinator(user);
  return jsonOk({ items });
});

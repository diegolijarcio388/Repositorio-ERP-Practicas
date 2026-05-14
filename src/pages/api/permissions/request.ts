import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createPermissionsService } from "../../../modules/permissions/services/permissions.service";

const permissionsService = createPermissionsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = (await context.request.json()) as {
    permissionDate?: string;
    reason?: string;
  };

  const item = await permissionsService.createRequest(user, {
    permissionDate: body.permissionDate ?? "",
    reason: body.reason ?? "",
  });

  return jsonOk({ item });
});

import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createPermissionsService } from "../../../modules/permissions/services/permissions.service";
import type { LegalPermissionType } from "../../../modules/permissions/domain/types";

const permissionsService = createPermissionsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = (await context.request.json()) as {
    permissionDate?: string;
    reason?: string;
    legalPermissionType?: LegalPermissionType | null;
    attachmentUrl?: string | null;
  };

  const item = await permissionsService.createRequest(user, {
    permissionDate: body.permissionDate ?? "",
    reason: body.reason ?? "",
    legalPermissionType: body.legalPermissionType ?? null,
    attachmentUrl: body.attachmentUrl ?? null,
  });

  return jsonOk({ item });
});

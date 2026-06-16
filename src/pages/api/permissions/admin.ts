import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createPermissionsService } from "../../../modules/permissions/services/permissions.service";
import type {
  LegalPermissionType,
  PermissionRequestStatus,
} from "../../../modules/permissions/domain/types";

const permissionsService = createPermissionsService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const status = context.url.searchParams.get("status") as
    | PermissionRequestStatus
    | null;
  const userId = context.url.searchParams.get("userId") ?? undefined;
  const dateFrom = context.url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = context.url.searchParams.get("dateTo") ?? undefined;

  const items = await permissionsService.listManagementPermissions(user, {
    status: status ?? undefined,
    userId,
    dateFrom,
    dateTo,
  });

  return jsonOk({ items });
});

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = (await context.request.json()) as {
    userId?: string;
    permissionDate?: string;
    reason?: string;
    legalPermissionType?: LegalPermissionType | null;
    attachmentUrl?: string | null;
    status?: PermissionRequestStatus;
    approverComment?: string;
  };

  const item = await permissionsService.createManualPermission(user, {
    userId: body.userId?.trim() || user.userId,
    permissionDate: body.permissionDate ?? "",
    reason: body.reason ?? "",
    legalPermissionType: body.legalPermissionType ?? null,
    attachmentUrl: body.attachmentUrl ?? null,
    status: body.status,
    approverComment: body.approverComment,
  });

  return jsonOk({ item });
});

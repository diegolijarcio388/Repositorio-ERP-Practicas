import type { APIRoute } from "astro";
import { withApiError } from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import { requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createPermissionsService } from "../../../../modules/permissions/services/permissions.service";

const permissionsService = createPermissionsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const requestId = context.params.id;
  if (!requestId) throw new Error("No se indicó la solicitud a revisar.");
  const body = await context.request.json();
  const status = body?.status;
  const comment = body?.comment ?? null;

  if (status !== "APPROVED" && status !== "REJECTED") {
    throw new Error("El estado de revisión no es válido.");
  }

  const item =
    status === "APPROVED"
      ? await permissionsService.approveAsAdmin(user, { requestId, comment })
      : await permissionsService.rejectAsAdmin(user, { requestId, comment });

  return jsonOk({ item });
});

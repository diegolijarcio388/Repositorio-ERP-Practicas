import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createRemoteWorkService } from "../../../modules/remote-work/services/remote-work.service";

const remoteWorkService = createRemoteWorkService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const items = await remoteWorkService.listPendingForAdmin(user);
  return jsonOk({ items });
});

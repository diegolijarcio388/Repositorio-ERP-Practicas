import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createRemoteWorkService } from "../../../modules/remote-work/services/remote-work.service";

const remoteWorkService = createRemoteWorkService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = (await context.request.json()) as {
    remoteWorkDate?: string;
    reason?: string;
  };

  const item = await remoteWorkService.createRequest(user, {
    remoteWorkDate: body.remoteWorkDate ?? "",
    reason: body.reason ?? "",
  });

  return jsonOk({ item });
});

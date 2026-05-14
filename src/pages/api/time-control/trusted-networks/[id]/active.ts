import type { APIRoute } from "astro";
import { withApiError } from "../../../../../core/server/api-handler";
import { jsonOk } from "../../../../../core/server/api-response";
import { requireApiUser } from "../../../../../modules/rbac/services/api-auth";
import { createTimeControlTrustedNetworksService } from "../../../../../modules/time-control/services/time-control-trusted-networks.service";

const trustedNetworksService = createTimeControlTrustedNetworksService();

export const PATCH: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const id = context.params.id!;
  const body = await context.request.json();

  await trustedNetworksService.setNetworkActive(
    user,
    id,
    Boolean(body?.isActive),
  );

  return jsonOk({});
});

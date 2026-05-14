import type { APIRoute } from "astro";
import { withApiError } from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import { requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createTimeControlTrustedNetworksService } from "../../../../modules/time-control/services/time-control-trusted-networks.service";

const trustedNetworksService = createTimeControlTrustedNetworksService();

export const PUT: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const id = context.params.id!;
  const body = await context.request.json();

  const item = await trustedNetworksService.updateNetwork(user, {
    id,
    name: body?.name,
    networkValue: body?.networkValue,
    networkType:
      body?.networkType === undefined
        ? undefined
        : body.networkType === "CIDR"
          ? "CIDR"
          : "EXACT_IP",
    isActive:
      body?.isActive === undefined ? undefined : Boolean(body.isActive),
    description: body?.description,
  });

  return jsonOk({ item });
});

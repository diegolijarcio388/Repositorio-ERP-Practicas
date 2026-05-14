import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createTimeControlTrustedNetworksService } from "../../../modules/time-control/services/time-control-trusted-networks.service";

const trustedNetworksService = createTimeControlTrustedNetworksService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const items = await trustedNetworksService.listNetworks(user);
  return jsonOk({ items });
});

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await context.request.json();

  const item = await trustedNetworksService.createNetwork(user, {
    name: body?.name ?? "",
    networkValue: body?.networkValue ?? "",
    networkType: body?.networkType === "CIDR" ? "CIDR" : "EXACT_IP",
    isActive:
      body?.isActive === undefined ? true : Boolean(body.isActive),
    description: body?.description ?? null,
  });

  return jsonOk({ item }, 201);
});

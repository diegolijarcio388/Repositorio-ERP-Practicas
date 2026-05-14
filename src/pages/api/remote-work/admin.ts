import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createRemoteWorkService } from "../../../modules/remote-work/services/remote-work.service";
import type { RemoteWorkRequestStatus } from "../../../modules/remote-work/domain/types";

const remoteWorkService = createRemoteWorkService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = (await context.request.json()) as {
    userId?: string;
    remoteWorkDate?: string;
    reason?: string;
    status?: RemoteWorkRequestStatus;
    approverComment?: string;
  };

  const item = await remoteWorkService.createManualRemoteWork(user, {
    userId: body.userId?.trim() || user.userId,
    remoteWorkDate: body.remoteWorkDate ?? "",
    reason: body.reason ?? "",
    status: body.status,
    approverComment: body.approverComment,
  });

  return jsonOk({ item });
});

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const status = context.url.searchParams.get("status") as RemoteWorkRequestStatus | null;
  const userId = context.url.searchParams.get("userId") ?? undefined;
  const dateFrom = context.url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = context.url.searchParams.get("dateTo") ?? undefined;

  const items = await remoteWorkService.listManagementRemoteWork(user, {
    status: status ?? undefined,
    userId,
    dateFrom,
    dateTo,
  });

  return jsonOk({ items });
});

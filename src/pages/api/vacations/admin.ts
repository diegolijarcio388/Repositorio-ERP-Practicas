import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import {
  ensureRole,
  requireApiUser,
} from "../../../modules/rbac/services/api-auth";
import { createVacationsService } from "../../../modules/vacations/services/vacations.service";
import type { VacationRequestStatus } from "../../../modules/vacations/domain/types";

const vacationsService = createVacationsService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin"]);
  const deptId = context.url.searchParams.get("deptId") ?? undefined;
  const userIdsRaw = context.url.searchParams.get("userIds");
  const userIds = userIdsRaw
    ? userIdsRaw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : undefined;
  const status = context.url.searchParams.get("status") as
    | VacationRequestStatus
    | null;
  const dateFrom = context.url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = context.url.searchParams.get("dateTo") ?? undefined;
  const items = await vacationsService.listAdmin({
    departmentId: deptId,
    userIds,
    status: status ?? undefined,
    dateFrom,
    dateTo,
  });
  return jsonOk({ items });
});

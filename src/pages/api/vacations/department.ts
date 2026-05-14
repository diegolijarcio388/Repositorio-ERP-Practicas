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
  ensureRole(user, ["coordinator", "admin"]);

  const status = context.url.searchParams.get("status") as
    | VacationRequestStatus
    | null;
  const userId = context.url.searchParams.get("userId") ?? undefined;
  const dateFrom = context.url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = context.url.searchParams.get("dateTo") ?? undefined;
  const departmentId = context.url.searchParams.get("departmentId") ?? undefined;

  const items = await vacationsService.listDepartmentRequests(user, {
    status: status ?? undefined,
    userId,
    dateFrom,
    dateTo,
    departmentId,
  });
  return jsonOk({ items });
});

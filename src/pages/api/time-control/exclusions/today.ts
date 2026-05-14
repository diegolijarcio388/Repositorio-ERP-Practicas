import type { APIRoute } from "astro";
import { withApiError } from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import { createPermissionsService } from "../../../../modules/permissions/services/permissions.service";
import { createRemoteWorkService } from "../../../../modules/remote-work/services/remote-work.service";
import { requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createVacationsService } from "../../../../modules/vacations/services/vacations.service";

const vacationsService = createVacationsService();
const permissionsService = createPermissionsService();
const remoteWorkService = createRemoteWorkService();

const getTodaySqlDate = (): string => {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
};

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const requestedDate = context.url.searchParams.get("date")?.trim() ?? "";
  const dateToQuery = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
    ? requestedDate
    : getTodaySqlDate();
  const [vacations, permissions, remoteWork] = await Promise.all([
    vacationsService.listApprovedVacationUsersForTimeControlDate(user, dateToQuery),
    permissionsService.listApprovedPermissionUsersForTimeControlDate(user, dateToQuery),
    remoteWorkService.listApprovedRemoteWorkUsersForTimeControlDate(user, dateToQuery),
  ]);

  return jsonOk({ vacations, permissions, remoteWork });
});

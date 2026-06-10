import type { APIRoute } from "astro";
import { jsonOk } from "../../../core/server/api-response";
import { withApiError } from "../../../core/server/api-handler";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import type { WorkdayStatus } from "../../../modules/time-control/domain/types";
import { createTimeControlService } from "../../../modules/time-control/services/time-control.service";

const timeControlService = createTimeControlService();
const VALID_WORKDAY_STATUSES: WorkdayStatus[] = [
  "OPEN",
  "COMPLETED",
  "INCOMPLETE",
  "INCIDENT",
];

const parseStatus = (value: string | null): WorkdayStatus | undefined => {
  if (!value) return undefined;
  return VALID_WORKDAY_STATUSES.includes(value as WorkdayStatus)
    ? (value as WorkdayStatus)
    : undefined;
};

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const dateFrom = context.url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = context.url.searchParams.get("dateTo") ?? undefined;
  const status = parseStatus(context.url.searchParams.get("status"));
  const includeOpen = context.url.searchParams.get("includeOpen") === "1";

  const items = await timeControlService.getMyRecords(user, {
    dateFrom,
    dateTo,
    status,
    includeOpen,
  });

  return jsonOk({ items });
});

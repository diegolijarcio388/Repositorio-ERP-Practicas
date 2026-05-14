import type { APIRoute } from "astro";
import {
  parseJsonBody,
  withApiError,
} from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createVacationsService } from "../../../modules/vacations/services/vacations.service";

const vacationsService = createVacationsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await parseJsonBody<
    | { days: string[]; usesHourBank?: boolean; requestTitle?: string; type?: "FULL_DAY" }
    | {
        type: "HOURLY";
        ranges: Array<{ day: string; startTime: string; endTime: string }>;
        requestTitle?: string;
      }
  >(context.request);

  const payload =
    "ranges" in body && body.type === "HOURLY"
      ? body
      : {
          type: "FULL_DAY" as const,
          days: "days" in body ? body.days : [],
          usesHourBank: "usesHourBank" in body ? body.usesHourBank : undefined,
          requestTitle: "requestTitle" in body ? body.requestTitle : undefined,
        };

  const created = await vacationsService.createRequest(user, payload);
  return jsonOk({ item: created }, 201);
});

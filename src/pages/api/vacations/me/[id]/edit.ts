import type { APIRoute } from "astro";
import {
  parseJsonBody,
  withApiError,
} from "../../../../../core/server/api-handler";
import { jsonOk } from "../../../../../core/server/api-response";
import { requireApiUser } from "../../../../../modules/rbac/services/api-auth";
import { createVacationsService } from "../../../../../modules/vacations/services/vacations.service";

const vacationsService = createVacationsService();

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const id = context.params.id;
  if (!id) throw new Error("ID de solicitud requerido.");
  const body = await parseJsonBody<
    | { type: "FULL_DAY"; days: string[]; comment?: string }
    | {
        type: "HOURLY";
        ranges: Array<{ day: string; startTime: string; endTime: string }>;
        comment?: string;
      }
  >(context.request);
  const updated = await vacationsService.editMyRequest(user, id, body);
  return jsonOk({ item: updated });
});

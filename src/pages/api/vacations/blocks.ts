import type { APIRoute } from "astro";
import {
  parseJsonBody,
  withApiError,
} from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import {
  ensureRole,
  requireApiUser,
} from "../../../modules/rbac/services/api-auth";
import { createVacationBlocksService } from "../../../modules/vacations/services/vacation-blocks.service";

const blocksService = createVacationBlocksService();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["coordinator", "admin", "worker"]);
  const requestedDepartment = context.url.searchParams.get("departmentId") ?? undefined;
  const departmentId = requestedDepartment ?? user.coordinatorDepartmentIds[0] ?? user.departmentId;
  const canReadDepartment =
    user.role === "admin" ||
    user.coordinatorDepartmentIds.includes(departmentId) ||
    user.departmentId === departmentId;
  if (!canReadDepartment) throw new Error("FORBIDDEN");
  const items = await blocksService.listForDepartment(departmentId);
  return jsonOk({ items });
});

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["coordinator", "admin"]);
  const body = await parseJsonBody<{
    departmentId?: string;
    days?: string[];
    startDate?: string;
    endDate?: string;
    reason?: string;
  }>(context.request);
  const created = await blocksService.create(user, body);
  return jsonOk({ item: created }, 201);
});

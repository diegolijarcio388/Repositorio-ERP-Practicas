import type { APIRoute } from "astro";
import { withApiError } from "../../../../core/server/api-handler";
import { jsonOk } from "../../../../core/server/api-response";
import { requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createDirectoryRepository } from "../../../../modules/vacations/repositories/directory.repository";

const directory = createDirectoryRepository();

export const PUT: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  const id = context.params.id!;
  const body = await context.request.json();
  const { name, coordinatorUserId } = body;
  const item = await directory.updateDepartment(id, { name, coordinatorUserId });
  return jsonOk({ item });
});

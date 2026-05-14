import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createDirectoryRepository } from "../../../modules/vacations/repositories/directory.repository";

const directory = createDirectoryRepository();

export const GET: APIRoute = withApiError(async (context) => {
  await requireApiUser(context);
  const items = await directory.listDepartments();
  return jsonOk({ items });
});

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  const body = await context.request.json();
  const { name, coordinatorUserId } = body;
  if (!name?.trim()) throw new Error("El nombre del departamento es obligatorio.");
  const item = await directory.createDepartment({ name, coordinatorUserId: coordinatorUserId ?? null });
  return jsonOk({ item });
});

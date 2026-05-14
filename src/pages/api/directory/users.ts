import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import { createDirectoryRepository } from "../../../modules/vacations/repositories/directory.repository";

const directory = createDirectoryRepository();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const departmentId = context.url.searchParams.get("departmentId");
  if (user.role === "admin") {
    const items = departmentId
      ? await directory.listByDepartment(departmentId)
      : await directory.listAllUsers();
    return jsonOk({ items });
  }

  const targetDepartmentId =
    departmentId ?? user.coordinatorDepartmentIds[0] ?? user.departmentId;
  const canReadDepartment =
    user.coordinatorDepartmentIds.includes(targetDepartmentId) ||
    user.departmentId === targetDepartmentId;
  if (!canReadDepartment) throw new Error("FORBIDDEN");
  const items = await directory.listByDepartment(targetDepartmentId);
  return jsonOk({ items });
});

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  if (user.role !== "admin") throw new Error("FORBIDDEN");

  const body = await context.request.json();
  const {
    name,
    jobTitle,
    email,
    departmentId,
    role,
    canManageTimeControlRequests,
    timeControlDevicePolicy,
    canManageVacations,
    canManageProjects,
  } = body;

  if (!name?.trim()) throw new Error("El nombre es obligatorio.");
  if (!email?.trim()) throw new Error("El email es obligatorio.");
  if (!departmentId) throw new Error("El departamento es obligatorio.");
  if (!["worker", "coordinator", "admin"].includes(role)) {
    throw new Error("Rol no válido.");
  }

  const item = await directory.createUser({
    name,
    jobTitle: jobTitle || null,
    email,
    departmentId,
    role,
    canManageTimeControlRequests: Boolean(canManageTimeControlRequests),
    timeControlDevicePolicy:
      timeControlDevicePolicy === "MOBILE_ONLY" ||
      timeControlDevicePolicy === "TABLET_OR_MOBILE"
        ? timeControlDevicePolicy
        : "TABLET_ONLY",
    canManageVacations: Boolean(canManageVacations),
    canManageProjects: Boolean(canManageProjects),
  });
  return jsonOk({ item });
});

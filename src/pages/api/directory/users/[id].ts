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

  if (role && !["worker", "coordinator", "admin"].includes(role)) {
    throw new Error("Rol no válido.");
  }

  const item = await directory.updateUser(id, {
    name,
    jobTitle: jobTitle !== undefined ? jobTitle || null : undefined,
    email,
    departmentId,
    role,
    canManageTimeControlRequests:
      canManageTimeControlRequests !== undefined
        ? Boolean(canManageTimeControlRequests)
        : undefined,
    timeControlDevicePolicy:
      timeControlDevicePolicy === undefined
        ? undefined
        : timeControlDevicePolicy === "MOBILE_ONLY" ||
            timeControlDevicePolicy === "TABLET_OR_MOBILE"
          ? timeControlDevicePolicy
          : "TABLET_ONLY",
    canManageVacations:
      canManageVacations !== undefined ? Boolean(canManageVacations) : undefined,
    canManageProjects:
      canManageProjects !== undefined ? Boolean(canManageProjects) : undefined,
  });

  return jsonOk({ item });
});

export const DELETE: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  if (user.role !== "admin") throw new Error("FORBIDDEN");

  const id = context.params.id!;
  try {
    await directory.deleteUser(id);
  } catch {
    throw new Error(
      "No se puede eliminar el trabajador porque tiene registros asociados (vacaciones, imputaciones, etc.).",
    );
  }

  return jsonOk({});
});

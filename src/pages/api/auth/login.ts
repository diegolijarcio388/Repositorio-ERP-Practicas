import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { createDirectoryRepository } from "../../../modules/vacations/repositories/directory.repository";

const directory = createDirectoryRepository();

const DB_ROLE_TO_SESSION: Record<string, string> = {
  admin: "Admin",
  coordinator: "Responsable",
  worker: "Empleado",
};

export const POST: APIRoute = withApiError(async (context) => {
  const { email } = await context.request.json();
  if (!email?.trim()) throw new Error("Email requerido.");

  const user = await directory.findUserByEmail(email.trim().toLowerCase());
  if (!user) throw new Error("Usuario no encontrado.");

  const role = DB_ROLE_TO_SESSION[user.role] ?? "Empleado";
  return jsonOk({
    role,
    displayName: user.name,
    canManageTimeControlRequests: user.canManageTimeControlRequests,
    timeControlDevicePolicy: user.timeControlDevicePolicy,
    canManageVacations: user.canManageVacations,
    canManageProjects: user.canManageProjects,
  });
});

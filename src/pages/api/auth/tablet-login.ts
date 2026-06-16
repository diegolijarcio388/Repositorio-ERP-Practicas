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
  const { code } = await context.request.json();
  const normalizedCode = String(code ?? "").trim();

  if (!normalizedCode) throw new Error("Código requerido.");

  const user = await directory.findUserByTabletCode(normalizedCode);
  if (!user) throw new Error("Código de tablet no válido.");

  const role = DB_ROLE_TO_SESSION[user.role] ?? "Empleado";
  return jsonOk({
    email: user.email,
    role,
    displayName: user.name,
    canManageTimeControlRequests: user.canManageTimeControlRequests,
    timeControlDevicePolicy: user.timeControlDevicePolicy,
    canManageVacations: user.canManageVacations,
    canManageProjects: user.canManageProjects,
  });
});

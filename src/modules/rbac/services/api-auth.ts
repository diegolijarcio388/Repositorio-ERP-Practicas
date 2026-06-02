import type { APIContext } from "astro";
import { SESSION_COOKIE_KEY } from "../../../core/config/keys";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type { AuthenticatedApiUser, VacationRole } from "../../vacations/domain/types";

interface SessionCookie {
  email: string;
  role: "Admin" | "Responsable" | "Empleado";
  canManageTimeControlRequests?: boolean;
  timeControlDevicePolicy?: "TABLET_ONLY" | "MOBILE_ONLY" | "TABLET_OR_MOBILE";
}

const directoryRepository = createDirectoryRepository();

const parseSession = (raw: string | undefined): SessionCookie | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as SessionCookie;
    if (!parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const requireApiUser = async (
  context: APIContext,
): Promise<AuthenticatedApiUser> => {
  const rawCookie = context.cookies.get(SESSION_COOKIE_KEY)?.value;
  const session = parseSession(rawCookie);
  if (!session) throw new Error("UNAUTHORIZED");
  const user = await directoryRepository.findUserByEmail(session.email);
  if (!user) throw new Error("UNAUTHORIZED");
  const coordinatedDepartments = await directoryRepository.listDepartmentsByCoordinator(user.id);
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    departmentId: user.departmentId,
    coordinatorDepartmentIds: coordinatedDepartments.map((department) => department.id),
    canManageTimeControlRequests: user.canManageTimeControlRequests,
    timeControlDevicePolicy: user.timeControlDevicePolicy,
    timeControlShiftId: user.timeControlShiftId,
    canManageVacations: user.canManageVacations,
    canManageProjects: user.canManageProjects,
  };
};

export const ensureRole = (
  user: AuthenticatedApiUser,
  accepted: VacationRole[],
): void => {
  if (!accepted.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
};

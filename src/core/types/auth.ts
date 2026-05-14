export const ROLES = ["Admin", "Responsable", "Empleado"] as const;

export type Role = (typeof ROLES)[number];

export interface UserSession {
  email: string;
  role: Role;
  displayName: string;
  canManageTimeControlRequests: boolean;
  timeControlDevicePolicy: "TABLET_ONLY" | "MOBILE_ONLY" | "TABLET_OR_MOBILE";
  canManageVacations: boolean;
  canManageProjects: boolean;
}

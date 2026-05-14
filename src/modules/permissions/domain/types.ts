export type PermissionRequestStatus =
  | "PENDING_COORDINATOR"
  | "PENDING_ADMIN"
  | "APPROVED"
  | "REJECTED";

export type PermissionRequestType = "FULL_DAY";

export interface PermissionRequestRecord {
  id: string;
  userId: string;
  departmentId: string;
  permissionDate: string;
  permissionType: PermissionRequestType;
  reason: string;
  status: PermissionRequestStatus;
  approverId: string | null;
  approverComment: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string | null;
}

export interface PermissionRequestFilters {
  status?: PermissionRequestStatus;
  userId?: string;
  userIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
}

export interface CreatePermissionRequestInput {
  id: string;
  userId: string;
  departmentId: string;
  permissionDate: string;
  permissionType: PermissionRequestType;
  reason: string;
  status: PermissionRequestStatus;
  approverId?: string | null;
  approverComment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PermissionRequestStatus =
  | "PENDING_COORDINATOR"
  | "PENDING_ADMIN"
  | "APPROVED"
  | "REJECTED";

export type PermissionRequestType = "FULL_DAY";

export type LegalPermissionType =
  | "MEDICAL"
  | "MARRIAGE"
  | "DEATH_SPOUSE_PARENT_CHILD"
  | "HOSPITALIZATION_OR_SECOND_DEGREE"
  | "MOVING"
  | "PUBLIC_DUTY"
  | "EXAM";

export type PermissionRequestedUnitType =
  | "NATURAL_DAYS"
  | "WORKING_DAYS"
  | "INDISPENSABLE_TIME";

export interface PermissionRequestRecord {
  id: string;
  userId: string;
  departmentId: string;
  permissionDate: string;
  permissionType: PermissionRequestType;
  legalPermissionType: LegalPermissionType | null;
  attachmentUrl: string | null;
  requestedUnits: number | null;
  requestedUnitType: PermissionRequestedUnitType | null;
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
  legalPermissionType?: LegalPermissionType | null;
  attachmentUrl?: string | null;
  requestedUnits?: number | null;
  requestedUnitType?: PermissionRequestedUnitType | null;
  reason: string;
  status: PermissionRequestStatus;
  approverId?: string | null;
  approverComment?: string | null;
  createdAt: string;
  updatedAt: string;
}

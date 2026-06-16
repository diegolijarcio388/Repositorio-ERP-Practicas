export type VacationRole = "worker" | "coordinator" | "admin";
export type TimeControlDevicePolicy =
  | "TABLET_ONLY"
  | "MOBILE_ONLY"
  | "TABLET_OR_MOBILE";

export type VacationRequestStatus =
  | "PENDING"
  | "PENDING_ADMIN"
  | "CHANGE_PENDING_COORDINATOR"
  | "CHANGE_PENDING_ADMIN"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type VacationRequestType = "FULL_DAY" | "HOURLY";

export type CalendarEventType = "HOLIDAY" | "EVENT";
export type CalendarEventScope = "GLOBAL" | "DEPARTMENT";

export interface VacationHourRange {
  day: string;
  startTime: string;
  endTime: string;
  hours: number;
}

export interface UserDirectoryRecord {
  id: string;
  name: string;
  jobTitle: string | null;
  email: string;
  departmentId: string;
  role: VacationRole;
  canManageTimeControlRequests: boolean;
  timeControlDevicePolicy: TimeControlDevicePolicy;
  timeControlTabletCode: string | null;
  timeControlShiftId: string | null;
  canManageVacations: boolean;
  canManageProjects: boolean;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  coordinatorUserId: string | null;
}

export interface VacationRequestRecord {
  id: string;
  userId: string;
  departmentId: string;
  requestTitle: string | null;
  days: string[];
  requestType: VacationRequestType;
  hourRanges: VacationHourRange[];
  hoursTotal: number;
  usesHourBank: boolean;
  status: VacationRequestStatus;
  approverId: string | null;
  approverComment: string | null;
  proposedDays: string[] | null;
  proposedHourRanges: VacationHourRange[] | null;
  proposedHoursTotal: number | null;
  changeRequestComment: string | null;
  changeOriginStatus: "PENDING_ADMIN" | "APPROVED" | null;
  createdByAdmin: boolean;
  fixedByDepartment: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VacationBlockRecord {
  id: string;
  departmentId: string;
  days: string[] | null;
  startDate: string | null;
  endDate: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CalendarEventRecord {
  id: string;
  title: string;
  description: string | null;
  type: CalendarEventType;
  scope: CalendarEventScope;
  departmentId: string | null;
  days: string[] | null;
  startDate: string | null;
  endDate: string | null;
  allDay: boolean;
  blocksSelection: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VacationEventHistoryRecord {
  id: string;
  requestId: string;
  fromStatus: VacationRequestStatus | null;
  toStatus: VacationRequestStatus;
  changedBy: string;
  comment: string | null;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  toUserId: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface AuthenticatedApiUser {
  userId: string;
  email: string;
  name: string;
  role: VacationRole;
  departmentId: string;
  coordinatorDepartmentIds: string[];
  canManageTimeControlRequests: boolean;
  timeControlDevicePolicy: TimeControlDevicePolicy;
  timeControlTabletCode: string | null;
  timeControlShiftId: string | null;
  canManageVacations: boolean;
  canManageProjects: boolean;
}

export interface VacationRequestFilters {
  status?: VacationRequestStatus;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  userIds?: string[];
}

export type WorkdayStatus =
  | "OPEN"
  | "COMPLETED"
  | "INCOMPLETE"
  | "INCIDENT";

export type IncidentFlag =
  | "NO_CHECKOUT"
  | "DURATION_TOO_SHORT"
  | "DURATION_TOO_LONG"
  | "OUT_OF_SCHEDULE"
  | "OUT_OF_ALLOWED_LOCATION"
  | "DEVICE_NOT_ALLOWED";

export type WorkdayDeviceType =
  | "MOBILE"
  | "TABLET"
  | "DESKTOP"
  | "UNKNOWN";

export type TimeControlDevicePolicy =
  | "TABLET_ONLY"
  | "MOBILE_ONLY"
  | "TABLET_OR_MOBILE";

export type WorkdayTrustLevel = "ALTA" | "MEDIA" | "BAJA" | "INVÁLIDA";

export type TimeControlAdminValidationReason =
  | "EXTERNAL_NETWORK"
  | "OUTSIDE_ALLOWED_LOCATION"
  | "DEVICE_NOT_ALLOWED"
  | "DESKTOP_DEVICE"
  | "UNKNOWN_DEVICE";

export type TimeControlAdminValidationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type JustifiableIncidentFlag = Exclude<IncidentFlag, "NO_CHECKOUT">;

export type WorkdayIncidentJustificationStatus =
  | "PENDING_COORDINATOR"
  | "PENDING_ADMIN"
  | "APPROVED"
  | "REJECTED";

export type AdjustmentRequestType = "CHECK_IN" | "CHECK_OUT";

export type AdjustmentRequestStatus =
  | "PENDING_COORDINATOR"
  | "PENDING_ADMIN"
  | "APPROVED"
  | "REJECTED";

export interface WorkdayRecord {
  id: string;
  userId: string;
  userName?: string | null;
  workDate: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: WorkdayStatus;
  workedMinutes: number;
  overtimeMinutes: number;
  incidentFlags: IncidentFlag[] | null;
  checkInLatitude: number;
  checkInLongitude: number;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkInDeviceType: WorkdayDeviceType;
  checkOutDeviceType: WorkdayDeviceType | null;
  checkInIpAddress: string | null;
  checkOutIpAddress: string | null;
  checkInUserAgent: string | null;
  checkOutUserAgent: string | null;
  checkInDeviceReason: string | null;
  checkOutDeviceReason: string | null;
  requiresAdminValidation: boolean;
  adminValidationReason: TimeControlAdminValidationReason | null;
  adminValidationStatus: TimeControlAdminValidationStatus | null;
  adminValidatedBy: string | null;
  adminValidatedAt: string | null;
  adminValidationComment: string | null;
  adminCloseComment: string | null;
  closedByAdminId: string | null;
  closedByAdminAt: string | null;
  trustLevel?: WorkdayTrustLevel;
  isTrustedNetwork?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkdayAdjustmentRequest {
  id: string;
  userId: string;
  userName?: string | null;
  requestDate: string;
  requestType: AdjustmentRequestType;
  requestedTime: string;
  requestedLatitude: number | null;
  requestedLongitude: number | null;
  reason: string;
  status: AdjustmentRequestStatus;
  coordinatorComment: string | null;
  adminComment: string | null;
  reviewedByCoordinatorId: string | null;
  reviewedByAdminId: string | null;
  hiddenByWorkerAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkdayIncidentJustification {
  id: string;
  recordId: string;
  userId: string;
  userName?: string | null;
  workDate?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  incidentFlags?: IncidentFlag[] | null;
  workedMinutes?: number;
  reason: string;
  status: WorkdayIncidentJustificationStatus;
  coordinatorComment: string | null;
  adminComment: string | null;
  reviewedByCoordinatorId: string | null;
  reviewedByAdminId: string | null;
  hiddenByWorkerAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkdayFilters {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: WorkdayStatus;
  includeOpen?: boolean;
}

export interface CreateCheckInInput {
  id: string;
  userId: string;
  workDate: string;
  checkInAt: string;
  checkInLatitude: number;
  checkInLongitude: number;
  checkInDeviceType: WorkdayDeviceType;
  checkInIpAddress: string | null;
  checkInUserAgent: string | null;
  checkInDeviceReason: string | null;
  requiresAdminValidation: boolean;
  adminValidationReason: TimeControlAdminValidationReason | null;
  adminValidationStatus: TimeControlAdminValidationStatus | null;
  adminValidatedBy: string | null;
  adminValidatedAt: string | null;
  adminValidationComment: string | null;
  status: WorkdayStatus;
  workedMinutes: number;
  overtimeMinutes: number;
  incidentFlags: IncidentFlag[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CloseCheckOutInput {
  recordId: string;
  checkOutAt: string;
  checkOutLatitude: number;
  checkOutLongitude: number;
  checkOutDeviceType: WorkdayDeviceType;
  checkOutIpAddress: string | null;
  checkOutUserAgent: string | null;
  checkOutDeviceReason: string | null;
  requiresAdminValidation: boolean;
  adminValidationReason: TimeControlAdminValidationReason | null;
  adminValidationStatus: TimeControlAdminValidationStatus | null;
  adminValidatedBy: string | null;
  adminValidatedAt: string | null;
  adminValidationComment: string | null;
  adminCloseComment?: string | null;
  closedByAdminId?: string | null;
  closedByAdminAt?: string | null;
  workedMinutes: number;
  overtimeMinutes: number;
  status: WorkdayStatus;
  incidentFlags: IncidentFlag[] | null;
  updatedAt: string;
}

export interface AdminCloseWorkdayRecordInput {
  recordId: string;
  checkOutAt: string;
  workedMinutes: number;
  overtimeMinutes: number;
  status: WorkdayStatus;
  incidentFlags: IncidentFlag[] | null;
  adminCloseComment: string | null;
  closedByAdminId: string;
  closedByAdminAt: string;
  updatedAt: string;
}

export interface CreateWorkdayAdjustmentRequestInput {
  id: string;
  userId: string;
  requestDate: string;
  requestType: AdjustmentRequestType;
  requestedTime: string;
  requestedLatitude: number | null;
  requestedLongitude: number | null;
  reason: string;
  status: AdjustmentRequestStatus;
  coordinatorComment: string | null;
  adminComment: string | null;
  reviewedByCoordinatorId: string | null;
  reviewedByAdminId: string | null;
  hiddenByWorkerAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkdayAdjustmentRequestFilters {
  userId?: string;
  userIds?: string[];
  status?: AdjustmentRequestStatus;
  statuses?: AdjustmentRequestStatus[];
  excludeHiddenByWorker?: boolean;
}

export interface ReviewWorkdayAdjustmentRequestInput {
  requestId: string;
  status: AdjustmentRequestStatus;
  coordinatorComment?: string | null;
  adminComment?: string | null;
  reviewedByCoordinatorId?: string | null;
  reviewedByAdminId?: string | null;
  updatedAt: string;
}

export interface WorkdayIncidentJustificationFilters {
  userId?: string;
  userIds?: string[];
  recordId?: string;
  recordIds?: string[];
  status?: WorkdayIncidentJustificationStatus;
  statuses?: WorkdayIncidentJustificationStatus[];
  excludeHiddenByWorker?: boolean;
}

export interface CreateWorkdayIncidentJustificationInput {
  id: string;
  recordId: string;
  userId: string;
  reason: string;
  status: WorkdayIncidentJustificationStatus;
  coordinatorComment: string | null;
  adminComment: string | null;
  reviewedByCoordinatorId: string | null;
  reviewedByAdminId: string | null;
  hiddenByWorkerAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWorkdayIncidentJustificationInput {
  justificationId: string;
  status: WorkdayIncidentJustificationStatus;
  coordinatorComment?: string | null;
  adminComment?: string | null;
  reviewedByCoordinatorId?: string | null;
  reviewedByAdminId?: string | null;
  updatedAt: string;
}

export type TrustedNetworkType = "EXACT_IP" | "CIDR";

export interface TimeControlAllowedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeControlAllowedLocationInput {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTimeControlAllowedLocationInput {
  id: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  isActive?: boolean;
  description?: string | null;
  updatedAt: string;
}

export interface TimeControlTrustedNetwork {
  id: string;
  name: string;
  networkValue: string;
  networkType: TrustedNetworkType;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeControlTrustedNetworkInput {
  id: string;
  name: string;
  networkValue: string;
  networkType: TrustedNetworkType;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTimeControlTrustedNetworkInput {
  id: string;
  name?: string;
  networkValue?: string;
  networkType?: TrustedNetworkType;
  isActive?: boolean;
  description?: string | null;
  updatedAt: string;
}

export interface ReviewWorkdayAdminValidationInput {
  recordId: string;
  adminValidationStatus: Extract<
    TimeControlAdminValidationStatus,
    "APPROVED" | "REJECTED"
  >;
  adminValidatedBy: string;
  adminValidatedAt: string;
  adminValidationComment: string | null;
  updatedAt: string;
}

export interface TimeControlShiftSegment {
  id: string;
  shiftId: string;
  segmentOrder: number;
  startTime: string;
  endTime: string;
  toleranceStartMinutes: number;
  toleranceEndMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeControlShift {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  allowsOvernight: boolean;
  createdAt: string;
  updatedAt: string;
  segments: TimeControlShiftSegment[];
}

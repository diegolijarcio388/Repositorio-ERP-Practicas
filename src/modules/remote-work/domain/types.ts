export type RemoteWorkRequestStatus =
  | "PENDING_COORDINATOR"
  | "PENDING_ADMIN"
  | "APPROVED"
  | "REJECTED";

export interface RemoteWorkRequestRecord {
  id: string;
  userId: string;
  departmentId: string;
  remoteWorkDate: string;
  reason: string;
  status: RemoteWorkRequestStatus;
  approverId: string | null;
  approverComment: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string | null;
}

export interface RemoteWorkRequestFilters {
  status?: RemoteWorkRequestStatus;
  userId?: string;
  userIds?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateRemoteWorkRequestInput {
  id: string;
  userId: string;
  departmentId: string;
  remoteWorkDate: string;
  reason: string;
  status: RemoteWorkRequestStatus;
  approverId?: string | null;
  approverComment?: string | null;
  createdAt: string;
  updatedAt: string;
}

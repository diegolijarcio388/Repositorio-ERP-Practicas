import type { AuthenticatedApiUser } from "../../vacations/domain/types";

export type { AuthenticatedApiUser };

// ── Enums ────────────────────────────────────────────────────────────────────

export const PROJECT_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const HOUR_TRACKING_MODES = ["GENERAL", "STRUCTURED", "BUILDING_BLOCK", "BOLSA_HORAS"] as const;
export type HourTrackingMode = (typeof HOUR_TRACKING_MODES)[number];

export const EXPENSE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const TIME_ENTRY_REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type TimeEntryReviewStatus = (typeof TIME_ENTRY_REVIEW_STATUSES)[number];

export const HOUR_BAG_REVIEW_STATUSES = ["EMPTY", "PENDING", "APPROVED", "REJECTED"] as const;
export type HourBagReviewStatus = (typeof HOUR_BAG_REVIEW_STATUSES)[number];

export const INTERNAL_CATEGORIES = [
  "GESTION_DPTO_IDI",
  "VARIOS_DPTO_IDI",
  "FERIAS_JORNADAS",
  "FORMACION_RECIBIDA",
  "VACACIONES",
  "BAJA_LABORAL",
  "PERMISO_MEDICO",
  "ASUNTOS_PROPIOS",
  "PERMISO_RETRIBUIDO",
  "FORMACION_IMPARTIDA",
  "ACTIVIDADES_COMERCIALES",
  "PREVENCION_RRLL",
  "VIGILANCIAS_TECNOLOGICAS",
  "PROGRAMAS_CONVOCATORIAS",
] as const;
export type InternalCategory = (typeof INTERNAL_CATEGORIES)[number];

export const INTERNAL_CATEGORY_LABELS: Record<InternalCategory, string> = {
  GESTION_DPTO_IDI: "Gestión Dpto I+D+i",
  VARIOS_DPTO_IDI: "Varios Dpto I+D+i",
  FERIAS_JORNADAS: "Ferias y Jornadas",
  FORMACION_RECIBIDA: "Formación Recibida",
  VACACIONES: "Vacaciones",
  BAJA_LABORAL: "Baja Laboral",
  PERMISO_MEDICO: "Permiso Médico",
  ASUNTOS_PROPIOS: "Asuntos Propios",
  PERMISO_RETRIBUIDO: "Permiso Retribuido",
  FORMACION_IMPARTIDA: "Formación Impartida",
  ACTIVIDADES_COMERCIALES: "Actividades Comerciales",
  PREVENCION_RRLL: "Prevención RR.LL.",
  VIGILANCIAS_TECNOLOGICAS: "Vigilancias Tecnológicas",
  PROGRAMAS_CONVOCATORIAS: "Programas y Convocatorias",
};

// ── Core records ─────────────────────────────────────────────────────────────

export interface ProjectRecord {
  id: string;
  code: string;
  name: string;
  clientName: string | null;
  status: ProjectStatus;
  startDate: string | null; // ISO date
  endDate: string | null;   // ISO date
  totalBudgetHours: number | null;
  hourTrackingMode: HourTrackingMode;
  managerId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkPackageRecord {
  id: string;
  projectId: string;
  name: string;
  budgetHours: number | null;
  startDate: string | null;
  endDate: string | null;
  position: number;
  createdAt: string;
}

export interface ProjectTaskRecord {
  id: string;
  projectId: string;
  workPackageId: string | null;
  name: string;
  budgetHours: number | null;
  startDate: string | null;
  endDate: string | null;
  isDefault: boolean;
  position: number;
  createdAt: string;
}

export interface ProjectAssignmentRecord {
  id: string;
  projectId: string;
  userId: string;
  assignedBy: string;
  createdAt: string;
}

export interface ProjectTaskAssignmentRecord {
  id: string;
  projectId: string;
  taskId: string;
  userId: string;
  assignedBy: string;
  createdAt: string;
}

export interface ProjectTimeEntryRecord {
  id: string;
  projectId: string;
  taskId: string;
  userId: string;
  projectName?: string;
  taskName?: string;
  userName?: string;
  date: string;   // ISO date
  hours: number;
  description: string;
  reviewStatus: TimeEntryReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InternalTimeEntryRecord {
  id: string;
  category: InternalCategory;
  userId: string;
  date: string;   // ISO date
  hours: number;
  description: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetPartitionRecord {
  id: string;
  projectId: string;
  name: string;
  budgetAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectHourBagEntryRecord {
  id: string;
  projectId: string;
  assignedUserId: string | null;
  company: string;
  purchaseOrderNumber: string;
  externalProjectName: string;
  taskName: string;
  buildingBlock: string;
  specialization: string;
  area: string;
  resourceName: string;
  hours: number | null;
  date: string | null;
  reviewStatus: HourBagReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRecord {
  id: string;
  partitionId: string;
  projectId: string;
  userId: string;
  amount: number;
  description: string;
  receiptUrl: string | null;
  status: ExpenseStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Composed views (enriched with names for the UI) ───────────────────────────

export interface ProjectWithDetails extends ProjectRecord {
  managerName: string;
  workPackages: WorkPackageWithTasks[];
  assignedUserIds: string[];
  budgetPartitions: BudgetPartitionRecord[];
  hourBagEntries: ProjectHourBagEntryRecord[];
}

export interface WorkPackageWithTasks extends WorkPackageRecord {
  tasks: ProjectTaskRecord[];
}

// Vista de proyecto para el trabajador: ve toda la estructura pero solo puede
// imputar en las tareas donde está asignado
export interface ProjectWorkerView extends ProjectRecord {
  managerName: string;
  workPackages: WorkPackageWithTasks[];
  assignedTaskIds: string[]; // tareas en las que puede imputar horas
  hourBagEntries: ProjectHourBagEntryRecord[];
}

// ── Inputs ────────────────────────────────────────────────────────────────────

export interface CreateProjectInput {
  code: string;
  name: string;
  clientName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalBudgetHours?: number | null;
  hourTrackingMode: HourTrackingMode;
  managerId: string;
  workPackages?: CreateWorkPackageInput[];
  assignedUserIds?: string[];
  budgetPartitions?: CreateBudgetPartitionInput[];
}

export interface UpdateProjectInput {
  code?: string;
  name?: string;
  clientName?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  totalBudgetHours?: number | null;
  managerId?: string;
}

export interface CreateWorkPackageInput {
  name: string;
  budgetHours?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  position?: number;
  tasks?: CreateTaskInput[];
}

export interface CreateTaskInput {
  name: string;
  budgetHours?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  position?: number;
}

export interface CreateProjectTimeEntryInput {
  projectId: string;
  taskId: string;
  date: string;
  hours: number;
  description: string;
}

export interface UpdateProjectTimeEntryInput {
  hours?: number;
  description?: string;
  taskId?: string;
}

export interface CreateInternalTimeEntryInput {
  category: InternalCategory;
  date: string;
  hours: number;
  description: string;
}

export interface UpdateInternalTimeEntryInput {
  hours?: number;
  description?: string;
}

export interface CreateBudgetPartitionInput {
  name: string;
  budgetAmount: number;
}

export interface CreateProjectHourBagEntryInput {
  company: string;
  purchaseOrderNumber: string;
  externalProjectName: string;
  taskName: string;
  buildingBlock: string;
  specialization: string;
  area: string;
  resourceName?: string;
  hours?: number | null;
  date?: string | null;
}

export interface UpdateProjectHourBagEntryInput {
  company?: string;
  purchaseOrderNumber?: string;
  externalProjectName?: string;
  taskName?: string;
  buildingBlock?: string;
  specialization?: string;
  area?: string;
  resourceName?: string;
  hours?: number;
  date?: string;
}

export interface CreateExpenseInput {
  partitionId: string;
  projectId: string;
  amount: number;
  description: string;
  receiptUrl?: string | null;
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface ProjectTimeEntryFilters {
  userId?: string;
  projectId?: string;
  taskId?: string;
  taskName?: string;
  dateFrom?: string;
  dateTo?: string;
  reviewStatus?: TimeEntryReviewStatus;
}

export interface InternalTimeEntryFilters {
  userId?: string;
  category?: InternalCategory;
  dateFrom?: string;
  dateTo?: string;
}

// Umbral a partir del cual se notifica al coordinador
export const ANOMALY_HOURS_THRESHOLD = 8;

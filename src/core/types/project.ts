export const PROJECT_STATUSES = ["Activo", "Pausado", "Cerrado"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface ProjectRecord {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  budgetHours: number | null;
  year: number;
}

export interface ProjectUpsertInput {
  id?: string;
  code?: string;
  name: string;
  status: ProjectStatus;
  budgetHours?: number | null;
}

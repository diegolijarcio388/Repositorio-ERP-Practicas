export const ASSIGNMENT_ROLES = [
  "Responsable",
  "Tecnico",
  "Consultor",
] as const;

export type AssignmentRole = (typeof ASSIGNMENT_ROLES)[number];

export interface ProjectAssignmentRecord {
  id: string;
  year: number;
  projectId: string;
  userEmail: string;
  role: AssignmentRole;
}

export interface ProjectAssignmentInput {
  projectId: string;
  userEmail: string;
  role: AssignmentRole;
}

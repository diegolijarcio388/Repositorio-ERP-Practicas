import type { AssignmentsRepository } from "../../../core/ports";
import type {
  ProjectAssignmentInput,
  ProjectAssignmentRecord,
} from "../../../core/types";
import { storage } from "../../../core/storage/storage";

const ASSIGNMENTS_STORAGE_KEY = "project_assignments_repository_v1";

const assignmentsSeedData: ProjectAssignmentRecord[] = [
  {
    id: "as-1",
    year: 2026,
    projectId: "pr-2026-1",
    userEmail: "admin@example.com",
    role: "Responsable",
  },
  {
    id: "as-2",
    year: 2026,
    projectId: "pr-2026-1",
    userEmail: "responsable@example.com",
    role: "Tecnico",
  },
  {
    id: "as-3",
    year: 2026,
    projectId: "pr-2026-2",
    userEmail: "tecnico@example.com",
    role: "Consultor",
  },
  {
    id: "as-4",
    year: 2027,
    projectId: "pr-2027-1",
    userEmail: "admin@example.com",
    role: "Responsable",
  },
  {
    id: "as-5",
    year: 2027,
    projectId: "pr-2027-2",
    userEmail: "responsable@example.com",
    role: "Consultor",
  },
];

const readAssignments = (): ProjectAssignmentRecord[] => {
  const stored = storage.get<ProjectAssignmentRecord[]>(
    ASSIGNMENTS_STORAGE_KEY,
    [],
  );
  if (stored.length > 0) return stored;
  storage.set(ASSIGNMENTS_STORAGE_KEY, assignmentsSeedData);
  return assignmentsSeedData;
};

const writeAssignments = (assignments: ProjectAssignmentRecord[]): void => {
  storage.set(ASSIGNMENTS_STORAGE_KEY, assignments);
};

class LocalAssignmentsRepository implements AssignmentsRepository {
  async listByProject(
    year: number,
    projectId: string,
  ): Promise<ProjectAssignmentRecord[]> {
    return readAssignments().filter(
      (assignment) =>
        assignment.year === year && assignment.projectId === projectId,
    );
  }

  async listByUser(
    year: number,
    userEmail: string,
  ): Promise<ProjectAssignmentRecord[]> {
    return readAssignments().filter(
      (assignment) =>
        assignment.year === year && assignment.userEmail === userEmail,
    );
  }

  async assign(
    year: number,
    input: ProjectAssignmentInput,
  ): Promise<ProjectAssignmentRecord> {
    const assignments = readAssignments();
    const normalizedEmail = input.userEmail.trim().toLowerCase();
    if (!normalizedEmail)
      throw new Error("El email del trabajador es obligatorio.");

    const duplicated = assignments.find(
      (assignment) =>
        assignment.year === year &&
        assignment.projectId === input.projectId &&
        assignment.userEmail === normalizedEmail,
    );
    if (duplicated)
      throw new Error("El trabajador ya esta asignado al proyecto en ese año.");

    const created: ProjectAssignmentRecord = {
      id: `as-${year}-${crypto.randomUUID()}`,
      year,
      projectId: input.projectId,
      userEmail: normalizedEmail,
      role: input.role,
    };
    assignments.push(created);
    writeAssignments(assignments);
    return created;
  }

  async unassign(year: number, assignmentId: string): Promise<void> {
    const assignments = readAssignments();
    const filtered = assignments.filter(
      (assignment) =>
        !(assignment.id === assignmentId && assignment.year === year),
    );
    writeAssignments(filtered);
  }
}

export const createAssignmentsRepository = (): AssignmentsRepository =>
  new LocalAssignmentsRepository();

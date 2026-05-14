import type { ProjectAssignmentInput, ProjectAssignmentRecord } from "../types";

export interface AssignmentsRepository {
  listByProject(
    year: number,
    projectId: string,
  ): Promise<ProjectAssignmentRecord[]>;
  listByUser(
    year: number,
    userEmail: string,
  ): Promise<ProjectAssignmentRecord[]>;
  assign(
    year: number,
    input: ProjectAssignmentInput,
  ): Promise<ProjectAssignmentRecord>;
  unassign(year: number, assignmentId: string): Promise<void>;
}

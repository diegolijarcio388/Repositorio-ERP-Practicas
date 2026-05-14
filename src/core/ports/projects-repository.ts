import type { ProjectRecord, ProjectUpsertInput } from "../types";

export interface ProjectsRepository {
  listByYear(year: number): Promise<ProjectRecord[]>;
  upsert(year: number, input: ProjectUpsertInput): Promise<ProjectRecord>;
}

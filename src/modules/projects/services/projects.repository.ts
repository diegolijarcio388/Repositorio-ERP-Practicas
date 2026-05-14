import type { ProjectsRepository } from "../../../core/ports";
import type { ProjectRecord, ProjectUpsertInput } from "../../../core/types";
import { storage } from "../../../core/storage/storage";

const PROJECTS_STORAGE_KEY = "projects_repository_v1";

const projectSeedData: ProjectRecord[] = [
  {
    id: "pr-2026-1",
    code: "ERP-101",
    name: "Migracion ERP compras",
    status: "Activo",
    budgetHours: 420,
    year: 2026,
  },
  {
    id: "pr-2026-2",
    code: "ERP-102",
    name: "Portal proveedores",
    status: "Pausado",
    budgetHours: 180,
    year: 2026,
  },
  {
    id: "pr-2026-3",
    code: "ERP-103",
    name: "Integracion BI",
    status: "Activo",
    budgetHours: 260,
    year: 2026,
  },
  {
    id: "pr-2027-1",
    code: "ERP-201",
    name: "Reingenieria logistica",
    status: "Activo",
    budgetHours: 300,
    year: 2027,
  },
  {
    id: "pr-2027-2",
    code: "ERP-202",
    name: "Automatizacion almacenes",
    status: "Cerrado",
    budgetHours: 150,
    year: 2027,
  },
];

const readProjects = (): ProjectRecord[] => {
  const storedProjects = storage.get<ProjectRecord[]>(PROJECTS_STORAGE_KEY, []);
  if (storedProjects.length > 0) return storedProjects;
  storage.set(PROJECTS_STORAGE_KEY, projectSeedData);
  return projectSeedData;
};

const writeProjects = (projects: ProjectRecord[]): void =>
  storage.set(PROJECTS_STORAGE_KEY, projects);

const buildAutoCode = (year: number, projects: ProjectRecord[]): string => {
  let counter = 1;
  let candidate = `AUTO-${year}-${String(counter).padStart(3, "0")}`;
  const hasCode = (code: string) =>
    projects.some(
      (project) =>
        project.year === year &&
        project.code.toUpperCase() === code.toUpperCase(),
    );

  while (hasCode(candidate)) {
    counter += 1;
    candidate = `AUTO-${year}-${String(counter).padStart(3, "0")}`;
  }
  return candidate;
};

class LocalProjectsRepository implements ProjectsRepository {
  async listByYear(year: number): Promise<ProjectRecord[]> {
    return readProjects().filter((project) => project.year === year);
  }

  async upsert(
    year: number,
    input: ProjectUpsertInput,
  ): Promise<ProjectRecord> {
    const projects = readProjects();
    const providedCode = (input.code ?? "").trim().toUpperCase();
    const existingProject = input.id
      ? (projects.find((project) => project.id === input.id) ?? null)
      : null;
    const normalizedCode =
      providedCode || existingProject?.code || buildAutoCode(year, projects);
    const normalizedBudgetHours =
      input.budgetHours == null || Number.isNaN(input.budgetHours)
        ? null
        : Number(input.budgetHours);

    if (normalizedBudgetHours != null && normalizedBudgetHours <= 0) {
      throw new Error("El presupuesto de horas debe ser mayor que cero.");
    }

    const duplicatedCode = projects.find(
      (project) =>
        project.year === year &&
        project.code.toUpperCase() === normalizedCode &&
        project.id !== input.id,
    );
    if (duplicatedCode)
      throw new Error("El codigo ya existe para el año seleccionado.");

    if (input.id) {
      const index = projects.findIndex((project) => project.id === input.id);
      if (index === -1) throw new Error("Proyecto no encontrado.");
      const updatedProject: ProjectRecord = {
        ...projects[index],
        code: normalizedCode,
        name: input.name.trim(),
        status: input.status,
        budgetHours: normalizedBudgetHours,
      };
      projects[index] = updatedProject;
      writeProjects(projects);
      return updatedProject;
    }

    const createdProject: ProjectRecord = {
      id: `pr-${year}-${crypto.randomUUID()}`,
      year,
      code: normalizedCode,
      name: input.name.trim(),
      status: input.status,
      budgetHours: normalizedBudgetHours,
    };
    projects.push(createdProject);
    writeProjects(projects);
    return createdProject;
  }
}

export const createProjectsRepository = (): ProjectsRepository =>
  new LocalProjectsRepository();

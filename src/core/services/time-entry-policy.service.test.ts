import { describe, expect, it } from "vitest";
import { createTimeEntryPolicyService } from "./time-entry-policy.service";
import type { AssignmentsRepository, TimeEntriesRepository } from "../ports";
import type {
  ProjectAssignmentRecord,
  TimeEntryInput,
  TimeEntryRecord,
} from "../types";

class FakeAssignmentsRepository implements AssignmentsRepository {
  constructor(private readonly items: ProjectAssignmentRecord[]) {}

  async listByProject(
    year: number,
    projectId: string,
  ): Promise<ProjectAssignmentRecord[]> {
    return this.items.filter(
      (item) => item.year === year && item.projectId === projectId,
    );
  }

  async listByUser(
    year: number,
    userEmail: string,
  ): Promise<ProjectAssignmentRecord[]> {
    return this.items.filter(
      (item) => item.year === year && item.userEmail === userEmail,
    );
  }

  async assign(
    year: number,
    input: {
      projectId: string;
      userEmail: string;
      role: "Responsable" | "Tecnico" | "Consultor";
    },
  ): Promise<ProjectAssignmentRecord> {
    void year;
    void input;
    throw new Error("Not implemented in test fake.");
  }

  async unassign(year: number, assignmentId: string): Promise<void> {
    void year;
    void assignmentId;
    throw new Error("Not implemented in test fake.");
  }
}

class FakeTimeEntriesRepository implements TimeEntriesRepository {
  public addCalls: Array<{ year: number; input: TimeEntryInput }> = [];

  async listByYear(year: number): Promise<TimeEntryRecord[]> {
    void year;
    return [];
  }

  async add(year: number, input: TimeEntryInput): Promise<TimeEntryRecord> {
    this.addCalls.push({ year, input });
    return {
      id: "te-test",
      year,
      projectId: input.projectId,
      userEmail: input.userEmail,
      date: input.date,
      hours: input.hours,
      category: input.category,
      description: input.description,
    };
  }
}

describe("time-entry-policy.service", () => {
  it("permite registrar horas cuando el usuario esta asignado al proyecto", async () => {
    const assignments = new FakeAssignmentsRepository([
      {
        id: "as-1",
        year: 2026,
        projectId: "pr-2026-1",
        userEmail: "tecnico@example.com",
        role: "Tecnico",
      },
    ]);
    const timeEntries = new FakeTimeEntriesRepository();
    const policy = createTimeEntryPolicyService(timeEntries, assignments);

    const result = await policy.add(2026, {
      projectId: "pr-2026-1",
      userEmail: "tecnico@example.com",
      date: "2026-01-10",
      hours: 2,
      category: "Soporte",
      description: "Validacion",
    });

    expect(result.id).toBe("te-test");
    expect(timeEntries.addCalls).toHaveLength(1);
  });

  it("rechaza registrar horas cuando el usuario no esta asignado al proyecto", async () => {
    const assignments = new FakeAssignmentsRepository([
      {
        id: "as-1",
        year: 2026,
        projectId: "pr-2026-1",
        userEmail: "tecnico@example.com",
        role: "Tecnico",
      },
    ]);
    const timeEntries = new FakeTimeEntriesRepository();
    const policy = createTimeEntryPolicyService(timeEntries, assignments);

    await expect(
      policy.add(2026, {
        projectId: "pr-2026-2",
        userEmail: "tecnico@example.com",
        date: "2026-01-10",
        hours: 2,
        category: "Soporte",
        description: "Intento invalido",
      }),
    ).rejects.toThrow(
      "El usuario no esta asignado al proyecto para el año seleccionado.",
    );

    expect(timeEntries.addCalls).toHaveLength(0);
  });
});

import type { AssignmentsRepository, TimeEntriesRepository } from "../ports";
import type { TimeEntryInput, TimeEntryRecord } from "../types";

export interface TimeEntryPolicyService {
  add(year: number, input: TimeEntryInput): Promise<TimeEntryRecord>;
}

class DefaultTimeEntryPolicyService implements TimeEntryPolicyService {
  constructor(
    private readonly timeEntries: TimeEntriesRepository,
    private readonly assignments: AssignmentsRepository,
  ) {}

  async add(year: number, input: TimeEntryInput): Promise<TimeEntryRecord> {
    const userAssignments = await this.assignments.listByUser(
      year,
      input.userEmail,
    );
    const isAssigned = userAssignments.some(
      (assignment) => assignment.projectId === input.projectId,
    );

    if (!isAssigned) {
      throw new Error(
        "El usuario no esta asignado al proyecto para el año seleccionado.",
      );
    }

    return this.timeEntries.add(year, input);
  }
}

export const createTimeEntryPolicyService = (
  timeEntries: TimeEntriesRepository,
  assignments: AssignmentsRepository,
): TimeEntryPolicyService =>
  new DefaultTimeEntryPolicyService(timeEntries, assignments);

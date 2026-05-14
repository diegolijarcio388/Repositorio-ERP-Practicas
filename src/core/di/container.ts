import type {
  AssignmentsRepository,
  AuthProvider,
  ProjectsRepository,
  TimeEntriesRepository,
} from "../ports";
import { createAssignmentsRepository } from "../../modules/assignments/services/assignments.repository";
import { createAuthService } from "../../modules/auth/services/auth.service";
import { createProjectsRepository } from "../../modules/projects/services/projects.repository";
import { createTimeEntriesRepository } from "../../modules/time/services/time.repository";
import {
  createTimeEntryPolicyService,
  type TimeEntryPolicyService,
} from "../services/time-entry-policy.service";

export interface AppContainer {
  auth: AuthProvider;
  assignments: AssignmentsRepository;
  projects: ProjectsRepository;
  timeEntries: TimeEntriesRepository;
  timeEntryPolicy: TimeEntryPolicyService;
}

let appContainer: AppContainer | null = null;

export const getContainer = (): AppContainer => {
  if (!appContainer) {
    const assignments = createAssignmentsRepository();
    const timeEntries = createTimeEntriesRepository();

    appContainer = {
      auth: createAuthService(),
      assignments,
      projects: createProjectsRepository(),
      timeEntries,
      timeEntryPolicy: createTimeEntryPolicyService(timeEntries, assignments),
    };
  }
  return appContainer;
};

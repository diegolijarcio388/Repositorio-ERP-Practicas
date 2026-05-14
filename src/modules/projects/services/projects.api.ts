import type {
  BudgetPartitionRecord,
  CreateBudgetPartitionInput,
  CreateExpenseInput,
  CreateInternalTimeEntryInput,
  CreateProjectInput,
  CreateProjectHourBagEntryInput,
  CreateProjectTimeEntryInput,
  CreateTaskInput,
  CreateWorkPackageInput,
  ExpenseRecord,
  InternalTimeEntryFilters,
  InternalTimeEntryRecord,
  ProjectRecord,
  ProjectTimeEntryFilters,
  ProjectTimeEntryRecord,
  ProjectWithDetails,
  ProjectWorkerView,
  UpdateInternalTimeEntryInput,
  UpdateProjectInput,
  UpdateProjectHourBagEntryInput,
  UpdateProjectTimeEntryInput,
} from "../domain/types";

const req = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Error de API");
  }
  return (await response.json()) as T;
};

const toQuery = (params: Record<string, string | undefined | null>): string => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") search.set(k, v);
  }
  const s = search.toString();
  return s ? `?${s}` : "";
};

export const projectsApi = {
  // ── Projects ────────────────────────────────────────────────────────────

  listProjects: async (): Promise<ProjectRecord[]> => {
    const res = await req<{ items: ProjectRecord[] }>("/api/projects");
    return res.items;
  },

  getProject: async (id: string): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${id}`);
    return res.item;
  },

  createProject: async (input: CreateProjectInput): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.item;
  },

  updateProject: async (id: string, input: UpdateProjectInput): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return res.item;
  },

  deleteProject: async (id: string): Promise<void> => {
    await req(`/api/projects/${id}`, { method: "DELETE" });
  },

  // ── Project sub-actions ─────────────────────────────────────────────────

  addWorkPackage: async (projectId: string, workPackage: CreateWorkPackageInput): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "add_work_package", workPackage }),
    });
    return res.item;
  },

  addTask: async (projectId: string, workPackageId: string | null, task: CreateTaskInput): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "add_task", workPackageId, task }),
    });
    return res.item;
  },

  addBudgetPartition: async (projectId: string, partition: CreateBudgetPartitionInput): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "add_budget_partition", partition }),
    });
    return res.item;
  },

  assignUsers: async (projectId: string, userIds: string[]): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "assign_users", userIds }),
    });
    return res.item;
  },

  removeUser: async (projectId: string, userId: string): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "remove_user", userId }),
    });
    return res.item;
  },

  assignUserToTask: async (projectId: string, taskId: string, userId: string): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "assign_task", taskId, userId }),
    });
    return res.item;
  },

  removeUserFromTask: async (projectId: string, taskId: string, userId: string): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "remove_task_assignment", taskId, userId }),
    });
    return res.item;
  },

  addHourBagEntry: async (
    projectId: string,
    entry: CreateProjectHourBagEntryInput,
    assignedUserIds: string[],
  ): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "add_hour_bag_entry", entry, assignedUserIds }),
    });
    return res.item;
  },

  updateHourBagEntry: async (
    projectId: string,
    entryId: string,
    entry: UpdateProjectHourBagEntryInput,
  ): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "update_hour_bag_entry", entryId, entry }),
    });
    return res.item;
  },

  deleteHourBagEntry: async (projectId: string, entryId: string): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "delete_hour_bag_entry", entryId }),
    });
    return res.item;
  },

  workerLogHourBagEntry: async (
    projectId: string,
    entryId: string,
    hours: number,
    date?: string,
  ): Promise<ProjectWorkerView> => {
    const res = await req<{ item: ProjectWorkerView }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "worker_log_hour_bag_entry", entryId, hours, date }),
    });
    return res.item;
  },

  approveHourBagEntry: async (projectId: string, entryId: string): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "approve_hour_bag_entry", entryId }),
    });
    return res.item;
  },

  rejectHourBagEntry: async (
    projectId: string,
    entryId: string,
    reason: string,
  ): Promise<ProjectWithDetails> => {
    const res = await req<{ item: ProjectWithDetails }>(`/api/projects/${projectId}`, {
      method: "POST",
      body: JSON.stringify({ action: "reject_hour_bag_entry", entryId, reason }),
    });
    return res.item;
  },

  // ── Time entries ────────────────────────────────────────────────────────

  listProjectTimeEntries: async (filters: ProjectTimeEntryFilters): Promise<ProjectTimeEntryRecord[]> => {
    const q = toQuery({ ...filters, type: "project" });
    const res = await req<{ items: ProjectTimeEntryRecord[] }>(`/api/projects/time-entries${q}`);
    return res.items;
  },

  listPendingProjectTimeEntries: async (): Promise<ProjectTimeEntryRecord[]> => {
    const res = await req<{ items: ProjectTimeEntryRecord[] }>("/api/projects/time-entries?type=project&view=pending");
    return res.items;
  },

  listInternalTimeEntries: async (filters: InternalTimeEntryFilters): Promise<InternalTimeEntryRecord[]> => {
    const q = toQuery({ ...filters, type: "internal" });
    const res = await req<{ items: InternalTimeEntryRecord[] }>(`/api/projects/time-entries${q}`);
    return res.items;
  },

  createProjectTimeEntry: async (input: CreateProjectTimeEntryInput): Promise<ProjectTimeEntryRecord> => {
    const res = await req<{ item: ProjectTimeEntryRecord }>("/api/projects/time-entries", {
      method: "POST",
      body: JSON.stringify({ type: "project", ...input }),
    });
    return res.item;
  },

  createInternalTimeEntry: async (input: CreateInternalTimeEntryInput): Promise<InternalTimeEntryRecord> => {
    const res = await req<{ item: InternalTimeEntryRecord }>("/api/projects/time-entries", {
      method: "POST",
      body: JSON.stringify({ type: "internal", ...input }),
    });
    return res.item;
  },

  updateProjectTimeEntry: async (id: string, input: UpdateProjectTimeEntryInput): Promise<ProjectTimeEntryRecord> => {
    const res = await req<{ item: ProjectTimeEntryRecord }>("/api/projects/time-entries", {
      method: "PATCH",
      body: JSON.stringify({ type: "project", action: "update", id, ...input }),
    });
    return res.item;
  },

  approveProjectTimeEntry: async (id: string): Promise<ProjectTimeEntryRecord> => {
    const res = await req<{ item: ProjectTimeEntryRecord }>("/api/projects/time-entries", {
      method: "PATCH",
      body: JSON.stringify({ type: "project", action: "approve", id }),
    });
    return res.item;
  },

  rejectProjectTimeEntry: async (id: string, reason: string): Promise<ProjectTimeEntryRecord> => {
    const res = await req<{ item: ProjectTimeEntryRecord }>("/api/projects/time-entries", {
      method: "PATCH",
      body: JSON.stringify({ type: "project", action: "reject", id, reason }),
    });
    return res.item;
  },

  updateInternalTimeEntry: async (id: string, input: UpdateInternalTimeEntryInput): Promise<InternalTimeEntryRecord> => {
    const res = await req<{ item: InternalTimeEntryRecord }>("/api/projects/time-entries", {
      method: "PATCH",
      body: JSON.stringify({ type: "internal", id, ...input }),
    });
    return res.item;
  },

  deleteProjectTimeEntry: async (id: string): Promise<void> => {
    await req(`/api/projects/time-entries${toQuery({ type: "project", id })}`, { method: "DELETE" });
  },

  deleteInternalTimeEntry: async (id: string): Promise<void> => {
    await req(`/api/projects/time-entries${toQuery({ type: "internal", id })}`, { method: "DELETE" });
  },

  // ── Expenses ────────────────────────────────────────────────────────────

  listMyExpenses: async (): Promise<ExpenseRecord[]> => {
    const res = await req<{ items: ExpenseRecord[] }>("/api/projects/expenses?view=my");
    return res.items;
  },

  listPendingExpenses: async (): Promise<ExpenseRecord[]> => {
    const res = await req<{ items: ExpenseRecord[] }>("/api/projects/expenses?view=pending");
    return res.items;
  },

  listProjectExpenses: async (projectId: string): Promise<ExpenseRecord[]> => {
    const res = await req<{ items: ExpenseRecord[] }>(`/api/projects/expenses?view=project&projectId=${projectId}`);
    return res.items;
  },

  createExpense: async (input: CreateExpenseInput): Promise<ExpenseRecord> => {
    const res = await req<{ item: ExpenseRecord }>("/api/projects/expenses", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.item;
  },

  approveExpense: async (id: string): Promise<ExpenseRecord> => {
    const res = await req<{ item: ExpenseRecord }>("/api/projects/expenses", {
      method: "PATCH",
      body: JSON.stringify({ action: "approve", id }),
    });
    return res.item;
  },

  rejectExpense: async (id: string, reason: string): Promise<ExpenseRecord> => {
    const res = await req<{ item: ExpenseRecord }>("/api/projects/expenses", {
      method: "PATCH",
      body: JSON.stringify({ action: "reject", id, reason }),
    });
    return res.item;
  },
};

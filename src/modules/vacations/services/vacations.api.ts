import type {
  CalendarEventRecord,
  DepartmentRecord,
  UserDirectoryRecord,
  VacationBlockRecord,
  VacationRequestRecord,
  VacationRequestStatus,
} from "../domain/types";

const toQuery = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return search.toString();
};

const request = async <T>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Error de API");
  }
  return (await response.json()) as T;
};

export const vacationsApi = {
  getMe: async (): Promise<VacationRequestRecord[]> => {
    const res = await request<{ items: VacationRequestRecord[] }>("/api/vacations/me");
    return res.items;
  },
  createRequest: async (
    payload:
      | string[]
      | {
          type: "FULL_DAY";
          days: string[];
          usesHourBank?: boolean;
          requestTitle?: string;
        }
      | {
          type: "HOURLY";
          ranges: Array<{ day: string; startTime: string; endTime: string }>;
          requestTitle?: string;
        },
  ): Promise<VacationRequestRecord> => {
    const body = Array.isArray(payload) ? { type: "FULL_DAY" as const, days: payload } : payload;
    const res = await request<{ item: VacationRequestRecord }>("/api/vacations/request", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.item;
  },
  cancelMyRequest: async (id: string, comment: string): Promise<VacationRequestRecord> => {
    const res = await request<{ item: VacationRequestRecord }>(`/api/vacations/me/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
    return res.item;
  },
  editMyRequest: async (
    id: string,
    payload:
      | { type: "FULL_DAY"; days: string[]; comment?: string }
      | {
          type: "HOURLY";
          ranges: Array<{ day: string; startTime: string; endTime: string }>;
          comment?: string;
        },
  ): Promise<VacationRequestRecord> => {
    const res = await request<{ item: VacationRequestRecord }>(`/api/vacations/me/${id}/edit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.item;
  },
  deleteMyCancelledRequest: async (id: string): Promise<void> => {
    try {
      await request<{ ok: boolean }>(`/api/vacations/me/${id}`, { method: "DELETE" });
    } catch {
      await request<{ ok: boolean }>(`/api/vacations/me/${id}`, { method: "POST" });
    }
  },
  listDepartment: async (filters: {
    status?: VacationRequestStatus;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    departmentId?: string;
  }): Promise<VacationRequestRecord[]> => {
    const query = toQuery(filters);
    const res = await request<{ items: VacationRequestRecord[] }>(
      `/api/vacations/department${query ? `?${query}` : ""}`,
    );
    return res.items;
  },
  approve: async (id: string, comment?: string): Promise<VacationRequestRecord> => {
    const res = await request<{ item: VacationRequestRecord }>(
      `/api/vacations/department/${id}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ comment }),
      },
    );
    return res.item;
  },
  reject: async (id: string, comment?: string): Promise<VacationRequestRecord> => {
    const res = await request<{ item: VacationRequestRecord }>(
      `/api/vacations/department/${id}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ comment }),
      },
    );
    return res.item;
  },
  deleteCancelledAsManager: async (id: string): Promise<void> => {
    await request<{ ok: boolean }>(`/api/vacations/department/${id}`, { method: "DELETE" });
  },
  listAdmin: async (filters: {
    deptId?: string;
    userIds?: string;
    status?: VacationRequestStatus;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<VacationRequestRecord[]> => {
    const query = toQuery(filters);
    const res = await request<{ items: VacationRequestRecord[] }>(
      `/api/vacations/admin${query ? `?${query}` : ""}`,
    );
    return res.items;
  },
  listBlocks: async (departmentId?: string): Promise<VacationBlockRecord[]> => {
    const query = toQuery({ departmentId });
    const res = await request<{ items: VacationBlockRecord[] }>(
      `/api/vacations/blocks${query ? `?${query}` : ""}`,
    );
    return res.items;
  },
  createBlock: async (payload: {
    departmentId?: string;
    days?: string[];
    startDate?: string;
    endDate?: string;
    reason?: string;
  }): Promise<VacationBlockRecord> => {
    const res = await request<{ item: VacationBlockRecord }>("/api/vacations/blocks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.item;
  },
  deleteBlock: async (id: string): Promise<void> => {
    await request<{ ok: boolean }>(`/api/vacations/blocks/${id}`, { method: "DELETE" });
  },
  listCalendarEvents: async (filters: {
    dateFrom?: string;
    dateTo?: string;
    departmentId?: string;
  }): Promise<CalendarEventRecord[]> => {
    const query = toQuery(filters);
    const res = await request<{ items: CalendarEventRecord[] }>(
      `/api/calendar/events${query ? `?${query}` : ""}`,
    );
    return res.items;
  },
  createCalendarEvent: async (payload: {
    title: string;
    description?: string;
    type: "HOLIDAY" | "EVENT";
    scope: "GLOBAL" | "DEPARTMENT";
    departmentId?: string;
    days?: string[];
    startDate?: string;
    endDate?: string;
    allDay?: boolean;
    blocksSelection?: boolean;
  }): Promise<CalendarEventRecord> => {
    const res = await request<{ item: CalendarEventRecord }>("/api/calendar/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.item;
  },
  listDepartments: async (): Promise<DepartmentRecord[]> => {
    const res = await request<{ items: DepartmentRecord[] }>("/api/directory/departments");
    return res.items;
  },
  listUsers: async (departmentId?: string): Promise<UserDirectoryRecord[]> => {
    const query = toQuery({ departmentId });
    const res = await request<{ items: UserDirectoryRecord[] }>(
      `/api/directory/users${query ? `?${query}` : ""}`,
    );
    return res.items;
  },
  createDepartmentFixedByAdmin: async (payload: {
    departmentId: string;
    days: string[];
    comment?: string;
    userIds?: string[];
  }): Promise<{
    created: Array<{ requestId: string; userId: string; userName: string; days: string[] }>;
    skipped: Array<{ userId: string; userName: string; reason: string }>;
  }> => {
    return request<{
      created: Array<{ requestId: string; userId: string; userName: string; days: string[] }>;
      skipped: Array<{ userId: string; userName: string; reason: string }>;
    }>("/api/vacations/admin/fixed-by-department", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};


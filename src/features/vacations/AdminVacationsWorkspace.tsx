import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Input, Modal, Select, Table, Toast } from "../../shared/ui";
import { vacationsApi } from "../../modules/vacations/services/vacations.api";
import { DayMultiSelect } from "../../modules/vacations/ui/DayMultiSelect";
import type {
  DepartmentRecord,
  UserDirectoryRecord,
  VacationRequestRecord,
} from "../../modules/vacations/domain/types";

const VACATION_DAYS_TOTAL = 22;
const TIME_BALANCE_DAYS_TOTAL = 6;
const VACATION_CALENDAR_YEAR = 2026;

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { name: "-", surname: "-" };
  return {
    name: parts[0] ?? "-",
    surname: parts.slice(1).join(" ") || "-",
  };
};

const STATUS_LABELS: Record<VacationRequestRecord["status"], string> = {
  PENDING: "Pendiente de coordinador",
  PENDING_ADMIN: "Pendiente de administración",
  CHANGE_PENDING_COORDINATOR: "Cambio pendiente de coordinador",
  CHANGE_PENDING_ADMIN: "Cambio pendiente de administración",
  APPROVED: "Aprobada",
  REJECTED: "Denegada",
  CANCELLED: "Cancelada",
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const requestSummary = (request: VacationRequestRecord): string => {
  if (request.requestType === "HOURLY") {
    const ranges =
      request.status === "CHANGE_PENDING_ADMIN"
        ? request.proposedHourRanges ?? []
        : request.hourRanges;
    if (!ranges.length) return "-";
    return ranges.map((range) => `${range.day} ${range.startTime}-${range.endTime}`).join(", ");
  }
  const days = request.status === "CHANGE_PENDING_ADMIN" ? request.proposedDays ?? [] : request.days;
  return days.length ? days.join(", ") : "-";
};

const requestTotal = (request: VacationRequestRecord): string => {
  if (request.requestType === "HOURLY") {
    if (request.status === "CHANGE_PENDING_ADMIN") return `${request.proposedHoursTotal ?? 0}h`;
    return `${request.hoursTotal}h`;
  }
  const days = request.status === "CHANGE_PENDING_ADMIN" ? request.proposedDays ?? [] : request.days;
  return `${days.length} dia(s)`;
};

const isPendingAdmin = (status: VacationRequestRecord["status"]) =>
  status === "PENDING_ADMIN" || status === "CHANGE_PENDING_ADMIN";

const DETAIL_STATUS_OPTIONS = [
  { value: "ALL", label: "Todos los estados" },
  { value: "PENDING_ADMIN", label: "Pendiente de administración" },
  { value: "CHANGE_PENDING_ADMIN", label: "Cambio pendiente de administración" },
  { value: "PENDING", label: "Pendiente de coordinador" },
  { value: "CHANGE_PENDING_COORDINATOR", label: "Cambio pendiente de coordinador" },
  { value: "APPROVED", label: "Aprobada" },
  { value: "REJECTED", label: "Denegada" },
  { value: "CANCELLED", label: "Cancelada" },
] as const;

const getRequestDateKey = (request: VacationRequestRecord): string => {
  const raw = request.createdAt;
  if (raw.length >= 10) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const getRequestNumber = (requestId: string): string => {
  const short = requestId.replace(/^vreq-/, "").slice(0, 8).toUpperCase();
  return `SOL-${short || requestId.slice(0, 8).toUpperCase()}`;
};

const buildYearDays = (year: number): string[] => {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(year, 0, 1));
  while (cursor.getUTCFullYear() === year) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

const formatDayHeader = (isoDay: string): string => {
  const [, month, day] = isoDay.split("-");
  return `${Number(day)}/${Number(month)}`;
};

interface AdminActionModalState {
  action: "approve" | "reject";
  user: UserDirectoryRecord;
  request: VacationRequestRecord;
  approvedDaysCount: number;
}

interface AdminDeleteModalState {
  user: UserDirectoryRecord;
  request: VacationRequestRecord;
}

export function AdminVacationsWorkspace() {
  const [users, setUsers] = useState<UserDirectoryRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [requests, setRequests] = useState<VacationRequestRecord[]>([]);
  const [workerSearch, setWorkerSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [detailStatusFilter, setDetailStatusFilter] = useState<string>("ALL");
  const [detailDateFromFilter, setDetailDateFromFilter] = useState("");
  const [detailDateToFilter, setDetailDateToFilter] = useState("");
  const [actionComment, setActionComment] = useState("");
  const [actionModal, setActionModal] = useState<AdminActionModalState | null>(null);
  const [deleteModal, setDeleteModal] = useState<AdminDeleteModalState | null>(null);
  const [fixedDepartmentId, setFixedDepartmentId] = useState("");
  const [fixedSelectedUserIds, setFixedSelectedUserIds] = useState<string[]>([]);
  const [fixedDays, setFixedDays] = useState<string[]>([]);
  const [fixedComment, setFixedComment] = useState("");
  const [isFixedSubmitting, setIsFixedSubmitting] = useState(false);
  const [fixedModalOpen, setFixedModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    null,
  );
  const lastAutoSelectedDepartmentId = useRef("");

  const load = async () => {
    const [usersData, departmentsData, requestsData] = await Promise.all([
      vacationsApi.listUsers(),
      vacationsApi.listDepartments(),
      vacationsApi.listAdmin({}),
    ]);
    setUsers(usersData);
    setDepartments(departmentsData);
    setRequests(requestsData);
  };

  useEffect(() => {
    void load();
  }, []);

  const fixedDepartmentUsers = useMemo(
    () =>
      users
        .filter((entry) => entry.departmentId === fixedDepartmentId && entry.role !== "admin")
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [fixedDepartmentId, users],
  );

  useEffect(() => {
    if (!fixedDepartmentId) {
      setFixedSelectedUserIds([]);
      lastAutoSelectedDepartmentId.current = "";
      return;
    }
    if (lastAutoSelectedDepartmentId.current === fixedDepartmentId) return;
    const departmentUserIds = fixedDepartmentUsers.map((entry) => entry.id);
    if (departmentUserIds.length === 0) return;
    setFixedSelectedUserIds(departmentUserIds);
    lastAutoSelectedDepartmentId.current = fixedDepartmentId;
  }, [fixedDepartmentId, fixedDepartmentUsers]);

  useEffect(() => {
    setHistoryPage(1);
  }, [selectedUserId, detailStatusFilter, detailDateFromFilter, detailDateToFilter, historyPageSize]);

  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments],
  );

  const requestsByUserId = useMemo(() => {
    const map = new Map<string, VacationRequestRecord[]>();
    for (const request of requests) {
      const current = map.get(request.userId) ?? [];
      current.push(request);
      map.set(request.userId, current);
    }
    return map;
  }, [requests]);

  const rows = useMemo(() => {
    return users.map((user) => {
      const userRequests = requestsByUserId.get(user.id) ?? [];
      const approvedDaysCount = userRequests
        .filter((request) => request.status === "APPROVED")
        .reduce((sum, request) => sum + request.days.length, 0);
      const pendingAdmin = userRequests.filter(
        (request) =>
          request.status === "PENDING_ADMIN" || request.status === "CHANGE_PENDING_ADMIN",
      );
      const pendingCoordinator = userRequests.filter((request) => request.status === "PENDING");
      const cancelled = userRequests.filter((request) => request.status === "CANCELLED");
      return {
        user,
        approvedDaysCount,
        pendingAdmin,
        pendingCoordinator,
        cancelled,
      };
    });
  }, [users, requestsByUserId]);

  const approvedDaysByUserId = useMemo(
    () => new Map(rows.map((row) => [row.user.id, row.approvedDaysCount])),
    [rows],
  );

  const yearDays = useMemo(() => buildYearDays(VACATION_CALENDAR_YEAR), []);

  const approvedVacationDaysByUserId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const request of requests) {
      if (request.status !== "APPROVED") continue;
      const current = map.get(request.userId) ?? new Set<string>();
      for (const day of request.days) {
        if (day.startsWith(`${VACATION_CALENDAR_YEAR}-`)) current.add(day);
      }
      map.set(request.userId, current);
    }
    return map;
  }, [requests]);

  const calendarRows = useMemo(
    () =>
      users
        .filter((user) => user.role !== "admin")
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [users],
  );

  const pendingRows = useMemo(
    () => rows.filter(({ pendingAdmin }) => pendingAdmin.length > 0),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = workerSearch.trim().toLowerCase();
    if (!query) return pendingRows;
    return pendingRows.filter(({ user }) => {
      const departmentName = (departmentById.get(user.departmentId) ?? user.departmentId).toLowerCase();
      const haystack = `${user.name} ${user.email} ${departmentName}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [departmentById, pendingRows, workerSearch]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const selectedUserRequests = useMemo(() => {
    if (!selectedUser) return [];
    return [...(requestsByUserId.get(selectedUser.id) ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [selectedUser, requestsByUserId]);

  const filteredSelectedUserRequests = useMemo(() => {
    return selectedUserRequests.filter((request) => {
      if (detailStatusFilter !== "ALL" && request.status !== detailStatusFilter) return false;
      const requestDate = getRequestDateKey(request);
      if (detailDateFromFilter && requestDate && requestDate < detailDateFromFilter) return false;
      if (detailDateToFilter && requestDate && requestDate > detailDateToFilter) return false;
      return true;
    });
  }, [detailDateFromFilter, detailDateToFilter, detailStatusFilter, selectedUserRequests]);

  const selectedPendingAdmin = useMemo(
    () => filteredSelectedUserRequests.filter((request) => isPendingAdmin(request.status)),
    [filteredSelectedUserRequests],
  );

  const selectedHistory = useMemo(
    () =>
      filteredSelectedUserRequests.filter((request) =>
        [
          "APPROVED",
          "REJECTED",
          "CANCELLED",
          "PENDING",
          "CHANGE_PENDING_COORDINATOR",
        ].includes(request.status),
      ),
    [filteredSelectedUserRequests],
  );

  const historyTotalPages = useMemo(
    () => Math.max(1, Math.ceil(selectedHistory.length / historyPageSize)),
    [historyPageSize, selectedHistory.length],
  );

  const paginatedSelectedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return selectedHistory.slice(start, start + historyPageSize);
  }, [historyPage, historyPageSize, selectedHistory]);

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages);
    }
  }, [historyPage, historyTotalPages]);

  const openActionModal = (
    action: "approve" | "reject",
    user: UserDirectoryRecord,
    request: VacationRequestRecord,
    approvedDaysCount: number,
  ) => {
    setActionComment("");
    setActionModal({
      action,
      user,
      request,
      approvedDaysCount,
    });
  };

  const closeActionModal = () => {
    setActionModal(null);
    setActionComment("");
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  const openUserDetail = (userId: string) => {
    setSelectedUserId(userId);
    setDetailStatusFilter("ALL");
    setDetailDateFromFilter("");
    setDetailDateToFilter("");
    setHistoryPage(1);
  };

  const closeUserDetail = () => {
    setSelectedUserId(null);
    setDetailStatusFilter("ALL");
    setDetailDateFromFilter("");
    setDetailDateToFilter("");
    setHistoryPage(1);
  };

  const confirmAction = async () => {
    if (!actionModal) return;
    try {
      if (actionModal.action === "approve") {
        await vacationsApi.approve(actionModal.request.id, actionComment.trim() || undefined);
        setToast({ message: "Solicitud aprobada por admin.", tone: "success" });
      } else {
        await vacationsApi.reject(actionModal.request.id, actionComment.trim() || undefined);
        setToast({ message: "Solicitud denegada por admin.", tone: "success" });
      }
      closeActionModal();
      await load();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : actionModal.action === "approve"
              ? "Error al aprobar solicitud"
              : "Error al denegar solicitud",
        tone: "error",
      });
    }
  };

  const confirmDeleteCancelled = async () => {
    if (!deleteModal) return;
    try {
      await vacationsApi.deleteCancelledAsManager(deleteModal.request.id);
      closeDeleteModal();
      setToast({ message: "Solicitud cancelada eliminada.", tone: "success" });
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al eliminar solicitud",
        tone: "error",
      });
    }
  };

  const submitDepartmentFixed = async () => {
    if (isFixedSubmitting) return;
    if (!fixedDepartmentId) {
      setToast({ message: "Selecciona un departamento.", tone: "error" });
      return;
    }
    if (fixedDays.length === 0) {
      setToast({ message: "Selecciona al menos un dia fijo.", tone: "error" });
      return;
    }
    if (fixedSelectedUserIds.length === 0) {
      setToast({ message: "Selecciona al menos un trabajador.", tone: "error" });
      return;
    }
    setIsFixedSubmitting(true);
    try {
      const result = await vacationsApi.createDepartmentFixedByAdmin({
        departmentId: fixedDepartmentId,
        userIds: fixedSelectedUserIds,
        days: fixedDays,
        comment: fixedComment.trim() || undefined,
      });
      const createdCount = result.created.length;
      const skippedCount = result.skipped.length;
      const skippedNames = result.skipped.map((item) => item.userName).slice(0, 3).join(", ");
      setToast({
        message:
          skippedCount > 0
            ? `Dias fijos aplicados a ${createdCount} trabajador(es). Omitidos ${skippedCount}: ${skippedNames}${skippedCount > 3 ? ", ..." : ""}.`
            : `Dias fijos aplicados a ${createdCount} trabajador(es).`,
        tone: "success",
      });
      setFixedDays([]);
      setFixedComment("");
      await load();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Error al marcar vacaciones fijas de departamento.",
        tone: "error",
      });
    } finally {
      setIsFixedSubmitting(false);
    }
  };

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "Selecciona un departamento" },
      ...departments.map((department) => ({
        value: department.id,
        label: department.name,
      })),
    ],
    [departments],
  );

  const allFixedUsersSelected =
    fixedDepartmentUsers.length > 0 && fixedSelectedUserIds.length === fixedDepartmentUsers.length;

  const isFixedUserSelected = (userId: string) => fixedSelectedUserIds.includes(userId);

  const toggleFixedUser = (userId: string) => {
    setFixedSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Vacaciones CETEMET</h1>
        <p className="text-sm text-slate-600">
          Validacion final de solicitudes tras la aprobacion del coordinador.
        </p>
      </header>

      <div className="max-w-md">
        <Input
          label="Buscar trabajador"
          placeholder="Nombre, apellidos, email o departamento"
          value={workerSearch}
          onChange={(event) => setWorkerSearch(event.target.value)}
        />
      </div>

      <Table
        headers={[
          "Nombre",
          "Apellidos",
          "Departamento",
          "Dias vacaciones",
          "Dias cuadre",
          "Notificacion",
          "Acciones",
        ]}
      >
        {filteredRows.map(({ user, approvedDaysCount, pendingAdmin, pendingCoordinator, cancelled }) => {
          const requestToResolve = pendingAdmin[0];
          const cancelledToDelete = cancelled[0];
          const { name, surname } = splitFullName(user.name);
          const notification =
            pendingAdmin.length > 0
              ? `Pendiente de administración (${pendingAdmin.length})`
              : pendingCoordinator.length > 0
                ? `Pendiente de coordinador (${pendingCoordinator.length})`
                : cancelled.length > 0
                  ? `Canceladas (${cancelled.length})`
                : "Sin solicitudes pendientes";

          return (
            <tr key={user.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{name}</td>
              <td className="px-4 py-3">{surname}</td>
              <td className="px-4 py-3">{departmentById.get(user.departmentId) ?? user.departmentId}</td>
              <td className="px-4 py-3">{VACATION_DAYS_TOTAL}</td>
              <td className="px-4 py-3">{TIME_BALANCE_DAYS_TOTAL}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    pendingAdmin.length > 0
                      ? "font-semibold text-amber-700"
                      : pendingCoordinator.length > 0
                        ? "text-sky-700"
                        : "text-slate-500"
                  }
                >
                  {notification}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" type="button" onClick={() => openUserDetail(user.id)}>
                    Ver detalle
                  </Button>
                  {requestToResolve ? (
                    <>
                      <Button
                        type="button"
                        onClick={() =>
                          openActionModal("approve", user, requestToResolve, approvedDaysCount)
                        }
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="danger"
                        type="button"
                        onClick={() =>
                          openActionModal("reject", user, requestToResolve, approvedDaysCount)
                        }
                      >
                        Denegar
                      </Button>
                    </>
                  ) : cancelledToDelete ? (
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => setDeleteModal({ user, request: cancelledToDelete })}
                    >
                      Eliminar
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
      {filteredRows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No hay trabajadores que coincidan con la busqueda.
        </p>
      ) : null}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Calendario anual de vacaciones</h2>
        <p className="text-sm text-slate-600">
          Vista por trabajador con dias aprobados en verde ({VACATION_CALENDAR_YEAR}).
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-max text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold">
                  Trabajador
                </th>
                <th className="sticky left-[220px] z-20 border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold">
                  Departamento
                </th>
                <th className="sticky left-[420px] z-20 border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold">
                  Sede
                </th>
                {yearDays.map((day) => (
                  <th
                    key={day}
                    className="min-w-7 border-b border-r border-slate-200 px-1 py-2 text-center font-medium text-slate-600"
                    title={day}
                  >
                    {formatDayHeader(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendarRows.map((user) => {
                const approvedDays = approvedVacationDaysByUserId.get(user.id) ?? new Set<string>();
                return (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="sticky left-0 z-10 min-w-[220px] border-r border-slate-200 bg-white px-3 py-2 font-medium text-slate-800">
                      {user.name}
                    </td>
                    <td className="sticky left-[220px] z-10 min-w-[200px] border-r border-slate-200 bg-white px-3 py-2 text-slate-700">
                      {departmentById.get(user.departmentId) ?? user.departmentId}
                    </td>
                    <td className="sticky left-[420px] z-10 min-w-[120px] border-r border-slate-200 bg-white px-3 py-2 text-slate-700">
                      -
                    </td>
                    {yearDays.map((day) => (
                      <td
                        key={`${user.id}-${day}`}
                        className={`h-6 min-w-7 border-r border-slate-200 ${
                          approvedDays.has(day) ? "bg-emerald-300" : "bg-white"
                        }`}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Vacaciones fijas por departamento</h2>
            <p className="text-sm text-slate-600">
              Marca dias obligatorios para un departamento y sus trabajadores.
            </p>
          </div>
          <Button type="button" onClick={() => setFixedModalOpen(true)}>
            Fijar vacaciones
          </Button>
        </div>
      </section>

      <Modal
        open={Boolean(selectedUser)}
        title={selectedUser ? `Detalle de ${selectedUser.name}` : "Detalle de trabajador"}
        onClose={closeUserDetail}
        panelClassName="max-w-6xl"
      >
        {selectedUser ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Departamento: {departmentById.get(selectedUser.departmentId) ?? selectedUser.departmentId}
            </p>

            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
              <Select
                label="Estado"
                options={[...DETAIL_STATUS_OPTIONS]}
                value={detailStatusFilter}
                onChange={(event) => setDetailStatusFilter(event.target.value)}
              />
              <Input
                label="Desde"
                type="date"
                value={detailDateFromFilter}
                onChange={(event) => setDetailDateFromFilter(event.target.value)}
              />
              <Input
                label="Hasta"
                type="date"
                value={detailDateToFilter}
                onChange={(event) => setDetailDateToFilter(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">
                Solicitudes pendientes de administración ({selectedPendingAdmin.length})
              </h3>
              {selectedPendingAdmin.length === 0 ? (
                <p className="text-sm text-slate-500">No hay solicitudes pendientes de admin.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Nº solicitud</th>
                        <th className="px-3 py-2 font-medium">Fecha</th>
                        <th className="px-3 py-2 font-medium">Solicitud</th>
                        <th className="px-3 py-2 font-medium">Total</th>
                        <th className="px-3 py-2 font-medium">Estado</th>
                        <th className="px-3 py-2 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPendingAdmin.map((request) => (
                        <tr key={request.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-xs">{getRequestNumber(request.id)}</td>
                          <td className="px-3 py-2">{formatDateTime(request.createdAt)}</td>
                          <td className="px-3 py-2">{requestSummary(request)}</td>
                          <td className="px-3 py-2">{requestTotal(request)}</td>
                          <td className="px-3 py-2">
                            <Badge>{STATUS_LABELS[request.status]}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                onClick={() =>
                                  openActionModal(
                                    "approve",
                                    selectedUser,
                                    request,
                                    approvedDaysByUserId.get(selectedUser.id) ?? 0,
                                  )
                                }
                              >
                                Aprobar
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                onClick={() =>
                                  openActionModal(
                                    "reject",
                                    selectedUser,
                                    request,
                                    approvedDaysByUserId.get(selectedUser.id) ?? 0,
                                  )
                                }
                              >
                                Denegar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Historico de solicitudes ({selectedHistory.length})
                </h3>
                <div className="w-40">
                  <Select
                    label="Filas por pagina"
                    options={[
                      { value: "5", label: "5" },
                      { value: "10", label: "10" },
                      { value: "20", label: "20" },
                      { value: "50", label: "50" },
                    ]}
                    value={String(historyPageSize)}
                    onChange={(event) => setHistoryPageSize(Number(event.target.value))}
                  />
                </div>
              </div>
              {selectedHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No hay historico para este trabajador.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Nº solicitud</th>
                        <th className="px-3 py-2 font-medium">Fecha</th>
                        <th className="px-3 py-2 font-medium">Solicitud</th>
                        <th className="px-3 py-2 font-medium">Total</th>
                        <th className="px-3 py-2 font-medium">Estado</th>
                        <th className="px-3 py-2 font-medium">Comentario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSelectedHistory.map((request) => (
                        <tr key={request.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-xs">{getRequestNumber(request.id)}</td>
                          <td className="px-3 py-2">{formatDateTime(request.createdAt)}</td>
                          <td className="px-3 py-2">{requestSummary(request)}</td>
                          <td className="px-3 py-2">{requestTotal(request)}</td>
                          <td className="px-3 py-2">
                            <Badge>{STATUS_LABELS[request.status]}</Badge>
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {request.approverComment?.trim() || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedHistory.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-slate-600">
                    Pagina {historyPage} de {historyTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setHistoryPage((current) => Math.max(1, current - 1))}
                      disabled={historyPage <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() =>
                        setHistoryPage((current) => Math.min(historyTotalPages, current + 1))
                      }
                      disabled={historyPage >= historyTotalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={fixedModalOpen}
        title="Vacaciones fijas por departamento"
        onClose={() => setFixedModalOpen(false)}
        panelClassName="max-w-5xl"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Marca dias obligatorios para todo un departamento. Se aprobaran automaticamente y
            descontaran del contador anual de cada trabajador.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Departamento"
              options={departmentOptions}
              value={fixedDepartmentId}
              onChange={(event) => setFixedDepartmentId(event.target.value)}
            />
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">Comentario (opcional)</span>
              <input
                type="text"
                value={fixedComment}
                onChange={(event) => setFixedComment(event.target.value)}
                placeholder="Ejemplo: cierre anual del departamento"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              />
            </label>
          </div>
          {fixedDepartmentId ? (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">
                  Trabajadores del departamento ({fixedSelectedUserIds.length}/{fixedDepartmentUsers.length})
                </p>
                {fixedDepartmentUsers.length > 0 ? (
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() =>
                      setFixedSelectedUserIds(
                        allFixedUsersSelected ? [] : fixedDepartmentUsers.map((entry) => entry.id),
                      )
                    }
                  >
                    {allFixedUsersSelected ? "Desmarcar todos" : "Marcar todos"}
                  </Button>
                ) : null}
              </div>
              {fixedDepartmentUsers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay trabajadores disponibles en este departamento.
                </p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {fixedDepartmentUsers.map((departmentUser) => (
                    <label
                      key={departmentUser.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {departmentUser.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500">{departmentUser.email}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={isFixedUserSelected(departmentUser.id)}
                        onChange={() => toggleFixedUser(departmentUser.id)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          <DayMultiSelect
            blockedDays={new Set<string>()}
            holidayDays={new Set<string>()}
            pendingDays={new Set<string>()}
            approvedDays={new Set<string>()}
            eventTitlesByDay={new Map<string, string[]>()}
            selectedDays={fixedDays}
            restrictPast={false}
            onChange={setFixedDays}
            monthsToShow={1}
            compact
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              Dias seleccionados: <strong>{fixedDays.length}</strong>
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" type="button" onClick={() => setFixedModalOpen(false)}>
                Cerrar
              </Button>
              <Button type="button" onClick={() => void submitDepartmentFixed()} disabled={isFixedSubmitting}>
                {isFixedSubmitting ? "Aplicando..." : "Aplicar dias fijos"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(actionModal)}
        title={actionModal?.action === "approve" ? "Confirmar aprobacion" : "Confirmar denegacion"}
        onClose={closeActionModal}
      >
        {actionModal ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Trabajador: <strong>{actionModal.user.name}</strong>
            </p>
            <p className="text-sm text-slate-700">
              {actionModal.request.requestType === "HOURLY" ? "Tramos solicitados:" : "Dias solicitados:"}{" "}
              {actionModal.request.requestType === "HOURLY"
                ? (actionModal.request.status === "CHANGE_PENDING_ADMIN"
                    ? actionModal.request.proposedHourRanges ?? []
                    : actionModal.request.hourRanges
                  )
                    .map((range) => `${range.day} ${range.startTime}-${range.endTime}`)
                    .join(", ")
                : (actionModal.request.status === "CHANGE_PENDING_ADMIN"
                    ? actionModal.request.proposedDays ?? []
                    : actionModal.request.days
                  ).join(", ")}
            </p>
            <p className="text-sm text-slate-700">
              {actionModal.request.requestType === "HOURLY" ? "Total horas solicitadas:" : "Total dias solicitados:"}{" "}
              {actionModal.request.requestType === "HOURLY"
                ? actionModal.request.status === "CHANGE_PENDING_ADMIN"
                  ? `${actionModal.request.proposedHoursTotal ?? 0}h`
                  : `${actionModal.request.hoursTotal}h`
                : (actionModal.request.status === "CHANGE_PENDING_ADMIN"
                    ? actionModal.request.proposedDays ?? []
                    : actionModal.request.days
                  ).length}
            </p>
            <p className="text-sm text-slate-700">
              Dias restantes tras esta solicitud:{" "}
              <strong>
                {actionModal.request.requestType === "HOURLY"
                  ? "-"
                  : VACATION_DAYS_TOTAL -
                    actionModal.approvedDaysCount -
                    (actionModal.request.status === "CHANGE_PENDING_ADMIN"
                      ? (actionModal.request.proposedDays ?? []).length
                      : actionModal.request.days.length)}
              </strong>
            </p>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">Comentario (opcional)</span>
              <textarea
                value={actionComment}
                onChange={(event) => setActionComment(event.target.value)}
                className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              />
            </label>
            <div className="flex gap-2">
              <Button
                variant={actionModal.action === "approve" ? "primary" : "danger"}
                type="button"
                onClick={() => void confirmAction()}
              >
                {actionModal.action === "approve" ? "Confirmar aprobacion" : "Confirmar denegacion"}
              </Button>
              <Button variant="primary" type="button" onClick={closeActionModal}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(deleteModal)}
        title="Eliminar solicitud cancelada"
        onClose={closeDeleteModal}
      >
        {deleteModal ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-700">
              Trabajador: <strong>{deleteModal.user.name}</strong>
            </p>
            <p className="text-sm font-medium text-slate-800">
              Dias: {deleteModal.request.days.join(", ")}
            </p>
            <p className="text-sm text-slate-700">
              Total dias: {deleteModal.request.days.length}
            </p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-sm font-medium text-amber-900">
                Esta accion eliminara definitivamente la solicitud.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="danger" type="button" onClick={() => void confirmDeleteCancelled()}>
                Eliminar solicitud
              </Button>
              <Button variant="primary" type="button" onClick={closeDeleteModal}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {toast ? (
        <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />
      ) : null}
    </section>
  );
}

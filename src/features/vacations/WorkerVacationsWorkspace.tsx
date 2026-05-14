import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Table, Toast } from "../../shared/ui";
import { vacationsApi } from "../../modules/vacations/services/vacations.api";
import { DayMultiSelect } from "../../modules/vacations/ui/DayMultiSelect";
import type { UserSession } from "../../core/types";
import type {
  CalendarEventRecord,
  VacationBlockRecord,
  VacationRequestRecord,
} from "../../modules/vacations/domain/types";

interface WorkerVacationsWorkspaceProps {
  session: UserSession;
}

const inRange = (value: string, from: string, to: string): boolean =>
  value >= from && value <= to;

const formatIsoToEsDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
};

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const VACATION_DAY_POOL = 28;
const HOUR_BANK_POOL = 16;

interface HourRangeDraft {
  day: string;
  startTime: string;
  endTime: string;
  hours: number;
}

const toMinutes = (value: string): number => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
};

const blockToDays = (block: VacationBlockRecord): string[] => {
  if (block.days?.length) return block.days;
  if (block.startDate && block.endDate) {
    const result: string[] = [];
    const current = new Date(`${block.startDate}T00:00:00.000Z`);
    const end = new Date(`${block.endDate}T00:00:00.000Z`);
    while (current.getTime() <= end.getTime()) {
      result.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return result;
  }
  return [];
};

export function WorkerVacationsWorkspace({ session }: WorkerVacationsWorkspaceProps) {
  const [requests, setRequests] = useState<VacationRequestRecord[]>([]);
  const [events, setEvents] = useState<CalendarEventRecord[]>([]);
  const [blocks, setBlocks] = useState<VacationBlockRecord[]>([]);
  const [requestMode, setRequestMode] = useState<"FULL_DAY" | "HOURLY">("FULL_DAY");
  const [requestTitleDraft, setRequestTitleDraft] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [useHourBankForDays, setUseHourBankForDays] = useState(false);
  const [hourRanges, setHourRanges] = useState<HourRangeDraft[]>([]);
  const [hourRangeModal, setHourRangeModal] = useState<{
    day: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [cancelComment, setCancelComment] = useState("");
  const [editModal, setEditModal] = useState<{
    requestId: string;
    requestType: "FULL_DAY" | "HOURLY";
    status: VacationRequestRecord["status"];
    currentDays: string[];
    currentHourRanges: HourRangeDraft[];
    usesHourBank: boolean;
  } | null>(null);
  const [editSelectedDays, setEditSelectedDays] = useState<string[]>([]);
  const [editHourRanges, setEditHourRanges] = useState<HourRangeDraft[]>([]);
  const [editHourRangeModal, setEditHourRangeModal] = useState<{
    day: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [editComment, setEditComment] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [cancelModal, setCancelModal] = useState<{
    requestId: string;
    days: string[];
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    requestId: string;
    days: string[];
  } | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    null,
  );
  const dateFrom = "2026-01-01";
  const dateTo = "2026-12-31";

  const load = async () => {
    const [meResult, calendarResult, blocksResult] = await Promise.allSettled([
      vacationsApi.getMe(),
      vacationsApi.listCalendarEvents({ dateFrom, dateTo }),
      vacationsApi.listBlocks(),
    ]);

    if (meResult.status === "fulfilled") {
      setRequests(meResult.value);
    }
    if (calendarResult.status === "fulfilled") {
      setEvents(calendarResult.value);
    }
    if (blocksResult.status === "fulfilled") {
      setBlocks(blocksResult.value);
    }

    const failedAreas: string[] = [];
    if (meResult.status === "rejected") failedAreas.push("tus solicitudes");
    if (calendarResult.status === "rejected") failedAreas.push("calendario/festivos");
    if (blocksResult.status === "rejected") failedAreas.push("bloqueos de departamento");

    if (failedAreas.length > 0) {
      const firstReason =
        meResult.status === "rejected"
          ? meResult.reason
          : calendarResult.status === "rejected"
            ? calendarResult.reason
            : blocksResult.status === "rejected"
              ? blocksResult.reason
              : null;
      const detail = firstReason instanceof Error ? ` ${firstReason.message}` : "";
      throw new Error(`No se pudieron cargar: ${failedAreas.join(", ")}.${detail}`);
    }
  };

  useEffect(() => {
    void load().catch((error) => {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar todos los datos de vacaciones.",
        tone: "error",
      });
    });
  }, []);

  const statusMeta: Record<VacationRequestRecord["status"], { label: string; classes: string }> = {
    PENDING: {
      label: "Pendiente",
      classes: "bg-amber-100 text-amber-800 ring-amber-200",
    },
    PENDING_ADMIN: {
      label: "Pendiente de administración",
      classes: "bg-sky-100 text-sky-800 ring-sky-200",
    },
    CHANGE_PENDING_COORDINATOR: {
      label: "Cambio pendiente de coordinador",
      classes: "bg-violet-100 text-violet-800 ring-violet-200",
    },
    CHANGE_PENDING_ADMIN: {
      label: "Cambio pendiente de administración",
      classes: "bg-indigo-100 text-indigo-800 ring-indigo-200",
    },
    APPROVED: {
      label: "Aprobada",
      classes: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    },
    REJECTED: {
      label: "Rechazada",
      classes: "bg-rose-100 text-rose-800 ring-rose-200",
    },
    CANCELLED: {
      label: "Cancelada",
      classes: "bg-slate-100 text-slate-700 ring-slate-200",
    },
  };

  const blockedDays = useMemo(() => {
    const result = new Set<string>();
    for (const block of blocks) {
      for (const day of blockToDays(block)) {
        if (inRange(day, dateFrom, dateTo)) result.add(day);
      }
    }
    for (const event of events) {
      const shouldBlock =
        event.type === "HOLIDAY" || (event.type === "EVENT" && event.blocksSelection);
      if (!shouldBlock) continue;
      const days = event.days ?? [];
      for (const day of days) result.add(day);
    }
    return result;
  }, [blocks, events]);

  const pendingDays = useMemo(() => {
    const result = new Set<string>();
    for (const request of requests) {
      if (
        request.status !== "PENDING" &&
        request.status !== "PENDING_ADMIN" &&
        request.status !== "CHANGE_PENDING_COORDINATOR" &&
        request.status !== "CHANGE_PENDING_ADMIN"
      ) {
        continue;
      }
      for (const day of request.days) result.add(day);
    }
    return result;
  }, [requests]);

  const approvedDays = useMemo(() => {
    const result = new Set<string>();
    for (const request of requests) {
      if (request.status !== "APPROVED") continue;
      for (const day of request.days) result.add(day);
    }
    return result;
  }, [requests]);

  const eventTitlesByDay = useMemo(() => {
    const result = new Map<string, string[]>();
    for (const block of blocks) {
      const reasonLabel = block.reason?.trim() ? `BLOQUEO: ${block.reason}` : "BLOQUEO";
      for (const day of blockToDays(block)) {
        const current = result.get(day) ?? [];
        current.push(reasonLabel);
        result.set(day, current);
      }
    }
    for (const event of events) {
      const typeLabel = event.type === "HOLIDAY" ? "FESTIVO" : "EVENTO";
      const days = event.days ?? [];
      for (const day of days) {
        const current = result.get(day) ?? [];
        current.push(`${typeLabel}: ${event.title}`);
        result.set(day, current);
      }
    }
    return result;
  }, [blocks, events]);

  const holidayDays = useMemo(() => {
    const result = new Set<string>();
    for (const event of events) {
      if (event.type !== "HOLIDAY") continue;
      for (const day of event.days ?? []) result.add(day);
    }
    return result;
  }, [events]);

  const holidayRows = useMemo(() => {
    const rows: Array<{ title: string; day: string }> = [];
    for (const event of events) {
      if (event.type !== "HOLIDAY") continue;
      for (const day of event.days ?? []) {
        rows.push({ title: event.title, day });
      }
    }
    return rows.sort((a, b) => a.day.localeCompare(b.day));
  }, [events]);

  const holidayByMonth = useMemo(() => {
    const map = new Map<number, Array<{ title: string; day: string }>>();
    for (const holiday of holidayRows) {
      const monthKey = Number(holiday.day.slice(5, 7)) - 1;
      const current = map.get(monthKey) ?? [];
      current.push(holiday);
      map.set(monthKey, current);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [holidayRows]);

  const { usedDays, usedHours, remainingDays, remainingHours } = useMemo(() => {
    const active = requests.filter(
      (request) =>
        request.status === "PENDING" ||
        request.status === "PENDING_ADMIN" ||
        request.status === "APPROVED",
    );

    const daySpent = active.reduce((acc, request) => {
      if (request.requestType !== "FULL_DAY") return acc;
      if (request.usesHourBank) return acc;
      return acc + request.days.length;
    }, 0);

    const hourSpent = active.reduce((acc, request) => {
      if (request.requestType === "HOURLY") return acc + request.hoursTotal;
      if (request.requestType === "FULL_DAY" && request.usesHourBank) {
        return acc + (request.hoursTotal || request.days.length * 8);
      }
      return acc;
    }, 0);

    return {
      usedDays: daySpent,
      usedHours: Number(hourSpent.toFixed(2)),
      remainingDays: Math.max(0, VACATION_DAY_POOL - daySpent),
      remainingHours: Math.max(0, Number((HOUR_BANK_POOL - hourSpent).toFixed(2))),
    };
  }, [requests]);

  const fixedDepartmentDays = useMemo(() => {
    const days = new Set<string>();
    for (const request of requests) {
      if (!request.fixedByDepartment) continue;
      if (request.status !== "APPROVED") continue;
      for (const day of request.days) days.add(day);
    }
    return [...days].sort((a, b) => a.localeCompare(b));
  }, [requests]);

  const selectedHourlyTotal = useMemo(
    () => Number(hourRanges.reduce((acc, range) => acc + range.hours, 0).toFixed(2)),
    [hourRanges],
  );

  const hourlySelectedDays = useMemo(
    () =>
      [...new Set(hourRanges.map((range) => range.day))].sort((a, b) => a.localeCompare(b)),
    [hourRanges],
  );

  const addHourlyRange = (day: string, startTime: string, endTime: string): boolean => {
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      setToast({ message: "Formato de hora invalido. Usa HH:mm.", tone: "error" });
      return false;
    }
    if (end <= start) {
      setToast({ message: "La hora fin debe ser posterior a la hora inicio.", tone: "error" });
      return false;
    }
    const hours = (end - start) / 60;
    if (hours > 8) {
      setToast({ message: "No se permiten mas de 8 horas por dia.", tone: "error" });
      return false;
    }

    const sameDayRanges = hourRanges
      .filter((range) => range.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (const range of sameDayRanges) {
      if (!(endTime <= range.startTime || startTime >= range.endTime)) {
        setToast({ message: "El tramo horario se solapa con otro del mismo dia.", tone: "error" });
        return false;
      }
    }

    const dailyTotal = sameDayRanges.reduce((acc, range) => acc + range.hours, 0) + hours;
    if (dailyTotal > 8) {
      setToast({ message: "El total de horas de ese dia supera 8 horas.", tone: "error" });
      return false;
    }

    setHourRanges((prev) =>
      [...prev, { day, startTime, endTime, hours }].sort((a, b) =>
        a.day === b.day ? a.startTime.localeCompare(b.startTime) : a.day.localeCompare(b.day),
      ),
    );
    return true;
  };

  const openHourlyRangeModal = (day: string) => {
    setHourRangeModal({ day, startTime: "08:00", endTime: "09:00" });
  };

  const confirmHourlyRangeModal = () => {
    if (!hourRangeModal) return;
    const created = addHourlyRange(
      hourRangeModal.day,
      hourRangeModal.startTime,
      hourRangeModal.endTime,
    );
    if (created) setHourRangeModal(null);
  };

  const handleHourlyCalendarChange = (days: string[]) => {
    const keep = new Set(days);
    setHourRanges((prev) => prev.filter((range) => keep.has(range.day)));
  };

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (requestMode === "FULL_DAY") {
        await vacationsApi.createRequest({
          type: "FULL_DAY",
          days: selectedDays,
          usesHourBank: useHourBankForDays,
          requestTitle: requestTitleDraft.trim() || undefined,
        });
      } else {
        await vacationsApi.createRequest({
          type: "HOURLY",
          ranges: hourRanges.map((range) => ({
            day: range.day,
            startTime: range.startTime,
            endTime: range.endTime,
          })),
          requestTitle: requestTitleDraft.trim() || undefined,
        });
        setHourRanges([]);
        setHourRangeModal(null);
      }
      setRequestTitleDraft("");
      setSelectedDays([]);
      setUseHourBankForDays(false);
      setCreateModalOpen(false);
      setSummaryOpen(false);
      setToast({ message: "Solicitud enviada correctamente (estado pendiente).", tone: "success" });
      try {
        await load();
      } catch {
        setToast({
          message: "La solicitud se envio, pero no se pudo refrescar la pantalla. Recarga la pagina.",
          tone: "error",
        });
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al crear solicitud",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCancelModal = () => {
    setCancelModal(null);
    setCancelComment("");
  };

  const openEditModal = (request: VacationRequestRecord) => {
    setEditModal({
      requestId: request.id,
      requestType: request.requestType,
      status: request.status,
      currentDays: request.days,
      currentHourRanges:
        request.requestType === "HOURLY"
          ? request.hourRanges.map((range) => ({
              day: range.day,
              startTime: range.startTime,
              endTime: range.endTime,
              hours: range.hours,
            }))
          : [],
      usesHourBank: request.usesHourBank,
    });
    setEditSelectedDays([...request.days]);
    setEditHourRanges(
      request.requestType === "HOURLY"
        ? request.hourRanges.map((range) => ({
            day: range.day,
            startTime: range.startTime,
            endTime: range.endTime,
            hours: range.hours,
          }))
        : [],
    );
    setEditComment("");
  };

  const closeEditModal = () => {
    setEditModal(null);
    setEditSelectedDays([]);
    setEditHourRanges([]);
    setEditHourRangeModal(null);
    setEditComment("");
    setIsEditSubmitting(false);
  };

  const confirmEditRequest = async () => {
    if (!editModal) return;
    if (isEditSubmitting) return;
    if (editModal.requestType === "FULL_DAY") {
      if (editSelectedDays.length === 0) {
        setToast({ message: "Debes seleccionar al menos un dia.", tone: "error" });
        return;
      }
    } else if (editHourRanges.length === 0) {
      setToast({ message: "Debes anadir al menos un tramo horario.", tone: "error" });
      return;
    }
    const requiresChangeRequest =
      editModal.status === "PENDING_ADMIN" || editModal.status === "APPROVED";
    if (requiresChangeRequest && !editComment.trim()) {
      setToast({
        message: "Debes indicar un comentario para solicitar el cambio al coordinador.",
        tone: "error",
      });
      return;
    }
    setIsEditSubmitting(true);
    try {
      await vacationsApi.editMyRequest(editModal.requestId, {
        ...(editModal.requestType === "FULL_DAY"
          ? {
              type: "FULL_DAY" as const,
              days: editSelectedDays,
              comment: editComment.trim() || undefined,
            }
          : {
              type: "HOURLY" as const,
              ranges: editHourRanges.map((range) => ({
                day: range.day,
                startTime: range.startTime,
                endTime: range.endTime,
              })),
              comment: editComment.trim() || undefined,
            }),
      });
      closeEditModal();
      setToast({
        message: requiresChangeRequest
          ? "Solicitud de cambio enviada al coordinador."
          : "Solicitud actualizada correctamente.",
        tone: "success",
      });
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al editar solicitud",
        tone: "error",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const editHourlySelectedDays = useMemo(
    () =>
      [...new Set(editHourRanges.map((range) => range.day))].sort((a, b) => a.localeCompare(b)),
    [editHourRanges],
  );

  const addEditHourlyRange = (day: string, startTime: string, endTime: string): boolean => {
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      setToast({ message: "Formato de hora invalido. Usa HH:mm.", tone: "error" });
      return false;
    }
    if (end <= start) {
      setToast({ message: "La hora fin debe ser posterior a la hora inicio.", tone: "error" });
      return false;
    }
    const hours = (end - start) / 60;
    if (hours > 8) {
      setToast({ message: "No se permiten mas de 8 horas por dia.", tone: "error" });
      return false;
    }
    const sameDayRanges = editHourRanges
      .filter((range) => range.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (const range of sameDayRanges) {
      if (!(endTime <= range.startTime || startTime >= range.endTime)) {
        setToast({ message: "El tramo horario se solapa con otro del mismo dia.", tone: "error" });
        return false;
      }
    }
    const dailyTotal = sameDayRanges.reduce((acc, range) => acc + range.hours, 0) + hours;
    if (dailyTotal > 8) {
      setToast({ message: "El total de horas de ese dia supera 8 horas.", tone: "error" });
      return false;
    }
    setEditHourRanges((prev) =>
      [...prev, { day, startTime, endTime, hours }].sort((a, b) =>
        a.day === b.day ? a.startTime.localeCompare(b.startTime) : a.day.localeCompare(b.day),
      ),
    );
    return true;
  };

  const openEditHourlyRangeModal = (day: string) => {
    setEditHourRangeModal({ day, startTime: "08:00", endTime: "09:00" });
  };

  const confirmEditHourlyRangeModal = () => {
    if (!editHourRangeModal) return;
    const created = addEditHourlyRange(
      editHourRangeModal.day,
      editHourRangeModal.startTime,
      editHourRangeModal.endTime,
    );
    if (created) setEditHourRangeModal(null);
  };

  const handleEditHourlyCalendarChange = (days: string[]) => {
    const keep = new Set(days);
    setEditHourRanges((prev) => prev.filter((range) => keep.has(range.day)));
  };

  const confirmCancellation = async () => {
    if (!cancelModal) return;
    const comment = cancelComment.trim();
    if (!comment) {
      setToast({
        message: "Indica el motivo de la cancelacion para el coordinador.",
        tone: "error",
      });
      return;
    }
    try {
      await vacationsApi.cancelMyRequest(cancelModal.requestId, comment);
      closeCancelModal();
      setToast({ message: "Vacaciones anuladas.", tone: "success" });
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al anular vacaciones",
        tone: "error",
      });
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteSubmitting(false);
    setDeleteModal(null);
  };

  const confirmDeleteCancelled = async () => {
    if (!deleteModal) return;
    if (isDeleteSubmitting) return;
    setIsDeleteSubmitting(true);
    try {
      await vacationsApi.deleteMyCancelledRequest(deleteModal.requestId);
      closeDeleteModal();
      setToast({ message: "Solicitud cancelada eliminada.", tone: "success" });
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al eliminar solicitud",
        tone: "error",
      });
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const editPendingDays = useMemo(() => {
    const result = new Set<string>();
    if (!editModal) return result;
    for (const request of requests) {
      if (request.id === editModal.requestId) continue;
      if (
        request.status !== "PENDING" &&
        request.status !== "PENDING_ADMIN" &&
        request.status !== "CHANGE_PENDING_COORDINATOR" &&
        request.status !== "CHANGE_PENDING_ADMIN"
      ) {
        continue;
      }
      for (const day of request.days) result.add(day);
    }
    return result;
  }, [editModal, requests]);

  const editApprovedDays = useMemo(() => {
    const result = new Set<string>();
    if (!editModal) return result;
    for (const request of requests) {
      if (request.id === editModal.requestId) continue;
      if (request.status !== "APPROVED") continue;
      for (const day of request.days) result.add(day);
    }
    return result;
  }, [editModal, requests]);

  return (
    <section className="space-y-6 pb-24">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Vacaciones</h1>
          <p className="text-sm text-slate-600">
            Usuario: {session.displayName}. Gestiona tus dias completos y tu bolsa de horas.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="grid gap-2 sm:grid-cols-2">
            <article className="min-w-56 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Dias disponibles
              </p>
              <p className="text-base font-bold text-emerald-900">
                {remainingDays}/{VACATION_DAY_POOL} dias
              </p>
              <p className="text-xs text-emerald-800">Consumidos: {usedDays}</p>
            </article>
            <article className="min-w-56 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
                Bolsa de horas
              </p>
              <p className="text-base font-bold text-sky-900">
                {remainingHours}h/{HOUR_BANK_POOL}h
              </p>
              <p className="text-xs text-sky-800">Consumidas: {usedHours}h</p>
            </article>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-3">
        <h2 className="text-lg font-semibold">Mis solicitudes</h2>
        {requests.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No hay solicitudes registradas.
          </p>
        ) : (
          <Table headers={["Tipo", "Detalle", "Total", "Estado", "Comentario", "Acciones"]}>
            {requests.map((request) => (
              <tr key={request.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {request.requestTitle?.trim()
                    ? request.requestTitle
                    : request.requestType === "HOURLY"
                      ? "Horas"
                      : request.fixedByDepartment
                        ? "Vacaciones de departamento"
                        : request.usesHourBank
                          ? "Dia completo (bolsa horas)"
                          : "Dia completo"}
                </td>
                <td className="px-4 py-3">
                  {request.requestType === "HOURLY"
                    ? request.status === "CHANGE_PENDING_COORDINATOR" ||
                        request.status === "CHANGE_PENDING_ADMIN"
                      ? `Actual: ${request.hourRanges.map((range) => `${range.day} ${range.startTime}-${range.endTime}`).join(", ")} | Propuesta: ${(request.proposedHourRanges ?? []).map((range) => `${range.day} ${range.startTime}-${range.endTime}`).join(", ")}`
                      : request.hourRanges
                          .map((range) => `${range.day} ${range.startTime}-${range.endTime}`)
                          .join(", ")
                    : request.status === "CHANGE_PENDING_COORDINATOR" ||
                        request.status === "CHANGE_PENDING_ADMIN"
                      ? `Actual: ${request.days.join(", ")} | Propuesta: ${(request.proposedDays ?? []).join(", ")}`
                      : request.days.join(", ")}
                </td>
                <td className="px-4 py-3">
                  {request.requestType === "HOURLY" || request.usesHourBank
                    ? request.status === "CHANGE_PENDING_COORDINATOR" ||
                      request.status === "CHANGE_PENDING_ADMIN"
                      ? `${request.hoursTotal}h -> ${request.proposedHoursTotal ?? request.hoursTotal}h`
                      : `${request.hoursTotal}h`
                    : `${request.days.length} dias`}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta[request.status].classes}`}
                  >
                    {statusMeta[request.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {request.status === "CHANGE_PENDING_COORDINATOR" ||
                  request.status === "CHANGE_PENDING_ADMIN"
                    ? request.changeRequestComment ?? "-"
                    : request.approverComment ?? "-"}
                </td>
                <td className="px-4 py-3">
                  {request.fixedByDepartment && request.status === "APPROVED" ? (
                    <span className="text-slate-400">Gestionado por administración</span>
                  ) : request.status === "PENDING" ||
                    request.status === "PENDING_ADMIN" ||
                    request.status === "APPROVED" ? (
                    <div className="flex gap-2">
                      <Button type="button" onClick={() => openEditModal(request)}>
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        type="button"
                        onClick={() => setCancelModal({ requestId: request.id, days: request.days })}
                      >
                        Anular vacaciones
                      </Button>
                    </div>
                  ) : request.status === "CHANGE_PENDING_COORDINATOR" ||
                    request.status === "CHANGE_PENDING_ADMIN" ? (
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => setCancelModal({ requestId: request.id, days: request.days })}
                    >
                      Anular vacaciones
                    </Button>
                  ) : request.status === "CANCELLED" ? (
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => setDeleteModal({ requestId: request.id, days: request.days })}
                    >
                      Eliminar
                    </Button>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      {fixedDepartmentDays.length > 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-amber-900">
            Vacaciones fijas asignadas por tu departamento
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            Estos días ya han sido reservados por administración y descontados de tu saldo:{" "}
            <strong>{fixedDepartmentDays.join(", ")}</strong>.
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Calendario de consulta</h2>
        <p className="text-sm text-slate-600">
          Vista de tus dias ya solicitados o aprobados, bloqueos y festivos.
        </p>
        <div>
          <Button type="button" onClick={() => setCreateModalOpen(true)}>
            Nueva solicitud
          </Button>
        </div>
        <DayMultiSelect
          blockedDays={blockedDays}
          holidayDays={holidayDays}
          pendingDays={pendingDays}
          approvedDays={approvedDays}
          eventTitlesByDay={eventTitlesByDay}
          selectedDays={[]}
          restrictPast={false}
          onChange={() => undefined}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
        <h2 className="text-base font-bold uppercase text-red-600">Observaciones:</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Cada trabajador dispone de 28 dias de vacaciones en este contador.</li>
          <li>
            Adicionalmente dispone de una bolsa de 16 horas (equivalente a 2 dias) para consumo
            por horas o por dias completos.
          </li>
          <li>
            Podemos disfrutar hasta 2 dias de cuadre de calendario fraccionados por horas enteras.
            En caso de querer pedir 3h de cuadre de calendario, en el Excel de Vacaciones 2026 se
            indicara la cantidad de 0,375 (3x0,125), en lugar de 1.
            La solicitud de propuesta de vacaciones se debe hacer al coordinador del area, poniendo
            en copia a recursos humanos, administracion@example.com.
            En el momento que de el visto bueno el director, procedemos desde recursos humanos a
            contabilizar los dias. Indicandose el total de dias reservados en la columna "Dias
            reservados" y los dias aun pendientes de definir en la columna "Dias pendientes".
            En determinadas areas, hay ciertos dias de vacaciones obligatorios, que ya vienen
            reflejados en el excel de vacaciones y la suma en "Dias reservados".
          </li>
          <li>
            La fecha limite para disfrutar de los dias de vacaciones y cuadre de calendario sera
            hasta el 31 de enero de 2027.
          </li>
          <li>Fiestas locales de Linares, 5 y 28 de Agosto.</li>
          <li>
            Horas laborales correspondientes a 221 dias de trabajo, 1768h. Como las horas pactadas
            que debemos trabajar son 1766, se descuentan 2 h de la jornada de trabajo del dia; 1 de
            abril (Miercoles Santo). El horario ese dia sera de 7h a 13h en caso de jornada
            intensiva y de 8 a 14:30 en caso de Jornada partida.
          </li>
          <li>
            Cuando el puesto de trabajo dependa en exclusividad de un determinado cliente, las
            vacaciones deben adaptarse al calendario del cliente.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Festivos</h2>
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-3">
          {holidayByMonth.map(([monthIndex, holidays]) => (
            <div
              key={monthIndex}
              className="space-y-2 rounded-lg border border-slate-100 p-2"
            >
              <h3 className="text-center text-base font-bold uppercase text-slate-900">
                {monthNames[monthIndex]}
              </h3>
              <ul className="flex flex-col items-center gap-y-1">
                {holidays.map((holiday) => (
                  <li key={`${holiday.title}-${holiday.day}`} className="text-center">
                    {holiday.title} - {formatIsoToEsDate(holiday.day)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={createModalOpen}
        title="Nueva solicitud"
        onClose={() => setCreateModalOpen(false)}
        panelClassName="max-w-4xl"
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">Nombre de la solicitud (opcional)</span>
            <input
              type="text"
              value={requestTitleDraft}
              onChange={(event) => setRequestTitleDraft(event.target.value)}
              maxLength={120}
              placeholder="Ejemplo: Vacaciones de verano"
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-slate-300 focus:ring"
            />
          </label>

          <div className="inline-flex rounded-lg border border-slate-200 p-1 text-sm">
            <button
              type="button"
              onClick={() => setRequestMode("FULL_DAY")}
              className={`rounded-md px-3 py-1.5 ${requestMode === "FULL_DAY" ? "bg-slate-900 text-white" : "text-slate-700"}`}
            >
              Dias completos
            </button>
            <button
              type="button"
              onClick={() => setRequestMode("HOURLY")}
              className={`rounded-md px-3 py-1.5 ${requestMode === "HOURLY" ? "bg-slate-900 text-white" : "text-slate-700"}`}
            >
              Por horas
            </button>
          </div>

          {requestMode === "FULL_DAY" ? (
            <div className="space-y-3">
              <DayMultiSelect
                blockedDays={blockedDays}
                holidayDays={holidayDays}
                pendingDays={pendingDays}
                approvedDays={approvedDays}
                eventTitlesByDay={eventTitlesByDay}
                selectedDays={selectedDays}
                restrictPast={session.role === "Empleado"}
                onChange={setSelectedDays}
                monthsToShow={1}
                compact
              />
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={useHourBankForDays}
                  onChange={(event) => setUseHourBankForDays(event.target.checked)}
                />
                Consumir esta solicitud desde la bolsa de horas (8h por dia)
              </label>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">
                Selecciona un dia en el calendario para abrir el modal de tramo horario.
              </p>
              <DayMultiSelect
                blockedDays={blockedDays}
                holidayDays={holidayDays}
                pendingDays={pendingDays}
                approvedDays={approvedDays}
                eventTitlesByDay={eventTitlesByDay}
                selectedDays={hourlySelectedDays}
                restrictPast={session.role === "Empleado"}
                onChange={handleHourlyCalendarChange}
                selectionMode="pick"
                onDayPick={openHourlyRangeModal}
                monthsToShow={1}
                compact
              />
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <p>
                  Horas en la solicitud actual: <strong>{selectedHourlyTotal}h</strong>
                </p>
                {hourRanges.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {hourRanges.map((range, index) => (
                      <li
                        key={`${range.day}-${range.startTime}-${range.endTime}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>
                          {range.day} - {range.startTime} a {range.endTime} ({range.hours}h)
                        </span>
                        <button
                          type="button"
                          className="text-sm text-rose-700 underline"
                          onClick={() =>
                            setHourRanges((prev) =>
                              prev.filter((_, currentIndex) => currentIndex !== index),
                            )
                          }
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-slate-500">No hay tramos anadidos.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => setSummaryOpen(true)}
              disabled={requestMode === "FULL_DAY" ? selectedDays.length === 0 : hourRanges.length === 0}
            >
              Confirmar
            </Button>
            <Button variant="ghost" type="button" onClick={() => setCreateModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(hourRangeModal)}
        title="Seleccion de tramo horario"
        onClose={() => setHourRangeModal(null)}
      >
        {hourRangeModal ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Dia seleccionado: <strong>{hourRangeModal.day}</strong>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-slate-700">Hora inicio</span>
                <input
                  type="time"
                  value={hourRangeModal.startTime}
                  onChange={(event) =>
                    setHourRangeModal((prev) =>
                      prev ? { ...prev, startTime: event.target.value } : prev,
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-slate-300 focus:ring"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-700">Hora fin</span>
                <input
                  type="time"
                  value={hourRangeModal.endTime}
                  onChange={(event) =>
                    setHourRangeModal((prev) =>
                      prev ? { ...prev, endTime: event.target.value } : prev,
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-slate-300 focus:ring"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={confirmHourlyRangeModal}>
                Confirmar tramo
              </Button>
              <Button variant="ghost" type="button" onClick={() => setHourRangeModal(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={summaryOpen}
        title="Resumen de solicitud"
        onClose={() => setSummaryOpen(false)}
      >
        <div className="space-y-3">
          {requestTitleDraft.trim() ? (
            <p className="text-sm text-slate-700">
              Nombre: <strong>{requestTitleDraft.trim()}</strong>
            </p>
          ) : null}
          {requestMode === "FULL_DAY" ? (
            <>
              <p>Total dias: {selectedDays.length}</p>
              <p className="text-sm text-slate-700">{selectedDays.sort().join(", ")}</p>
              <p className="text-sm text-slate-700">
                Consumo:{" "}
                <strong>{useHourBankForDays ? `${selectedDays.length * 8}h de bolsa` : "dias de vacaciones"}</strong>
              </p>
            </>
          ) : (
            <>
              <p>Total tramos: {hourRanges.length}</p>
              <p className="text-sm text-slate-700">Horas totales: {selectedHourlyTotal}h</p>
              <ul className="space-y-1 text-sm text-slate-700">
                {hourRanges.map((range, index) => (
                  <li
                    key={`${range.day}-${range.startTime}-${range.endTime}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>
                      {range.day} - {range.startTime} a {range.endTime} ({range.hours}h)
                    </span>
                    <button
                      type="button"
                      className="text-sm text-rose-700 underline"
                      onClick={() =>
                        setHourRanges((prev) =>
                          prev.filter((_, currentIndex) => currentIndex !== index),
                        )
                      }
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Button type="button" onClick={() => void submit()} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </Modal>
      <Modal
        open={Boolean(editModal)}
        title="Editar solicitud"
        onClose={closeEditModal}
      >
        {editModal ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Estado actual: <strong>{statusMeta[editModal.status].label}</strong>
            </p>
            {editModal.requestType === "FULL_DAY" ? (
              <>
                <p className="text-sm text-slate-700">
                  Dias actuales: {editModal.currentDays.join(", ")}
                </p>
                <DayMultiSelect
                  blockedDays={blockedDays}
                  holidayDays={holidayDays}
                  pendingDays={editPendingDays}
                  approvedDays={editApprovedDays}
                  eventTitlesByDay={eventTitlesByDay}
                  selectedDays={editSelectedDays}
                  restrictPast={session.role === "Empleado"}
                  onChange={setEditSelectedDays}
                  monthsToShow={1}
                />
              </>
            ) : (
              <>
                <p className="text-sm text-slate-700">
                  Tramos actuales:{" "}
                  {editModal.currentHourRanges
                    .map((range) => `${range.day} ${range.startTime}-${range.endTime}`)
                    .join(", ")}
                </p>
                <p className="text-sm text-slate-600">
                  Selecciona un dia para abrir el modal de tramo horario.
                </p>
                <DayMultiSelect
                  blockedDays={blockedDays}
                  holidayDays={holidayDays}
                  pendingDays={editPendingDays}
                  approvedDays={editApprovedDays}
                  eventTitlesByDay={eventTitlesByDay}
                  selectedDays={editHourlySelectedDays}
                  restrictPast={session.role === "Empleado"}
                  onChange={handleEditHourlyCalendarChange}
                  selectionMode="pick"
                  onDayPick={openEditHourlyRangeModal}
                  monthsToShow={1}
                />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {editHourRanges.length > 0 ? (
                    <ul className="space-y-1">
                      {editHourRanges.map((range, index) => (
                        <li
                          key={`${range.day}-${range.startTime}-${range.endTime}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>
                            {range.day} - {range.startTime} a {range.endTime} ({range.hours}h)
                          </span>
                          <button
                            type="button"
                            className="text-sm text-rose-700 underline"
                            onClick={() =>
                              setEditHourRanges((prev) =>
                                prev.filter((_, currentIndex) => currentIndex !== index),
                              )
                            }
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">No hay tramos anadidos.</p>
                  )}
                </div>
              </>
            )}
            {editModal.status === "PENDING_ADMIN" || editModal.status === "APPROVED" ? (
              <label className="block">
                <span className="mb-1 block text-sm text-slate-700">
                  Comentario para el coordinador (obligatorio)
                </span>
                <textarea
                  value={editComment}
                  onChange={(event) => setEditComment(event.target.value)}
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
                  placeholder="Explica los cambios que solicitas"
                />
              </label>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" onClick={() => void confirmEditRequest()} disabled={isEditSubmitting}>
                {isEditSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button variant="ghost" type="button" onClick={closeEditModal}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(editHourRangeModal)}
        title="Seleccion de tramo horario"
        onClose={() => setEditHourRangeModal(null)}
      >
        {editHourRangeModal ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Dia seleccionado: <strong>{editHourRangeModal.day}</strong>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-slate-700">Hora inicio</span>
                <input
                  type="time"
                  value={editHourRangeModal.startTime}
                  onChange={(event) =>
                    setEditHourRangeModal((prev) =>
                      prev ? { ...prev, startTime: event.target.value } : prev,
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-slate-300 focus:ring"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-700">Hora fin</span>
                <input
                  type="time"
                  value={editHourRangeModal.endTime}
                  onChange={(event) =>
                    setEditHourRangeModal((prev) =>
                      prev ? { ...prev, endTime: event.target.value } : prev,
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-slate-300 focus:ring"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={confirmEditHourlyRangeModal}>
                Confirmar tramo
              </Button>
              <Button variant="ghost" type="button" onClick={() => setEditHourRangeModal(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(cancelModal)}
        title="Confirmar anulacion de vacaciones"
        onClose={closeCancelModal}
      >
        {cancelModal ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">Dias: {cancelModal.days.join(", ")}</p>
            <p className="text-sm text-slate-700">Total dias: {cancelModal.days.length}</p>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">
                Motivo para el coordinador
              </span>
              <textarea
                value={cancelComment}
                onChange={(event) => setCancelComment(event.target.value)}
                className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
                placeholder="Indica el motivo de la anulacion"
              />
            </label>
            <div className="flex gap-2">
              <Button variant="danger" type="button" onClick={() => void confirmCancellation()}>
                Confirmar anulacion
              </Button>
              <Button variant="primary" type="button" onClick={closeCancelModal}>
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
            <p className="text-sm font-medium text-slate-800">Dias: {deleteModal.days.join(", ")}</p>
            <p className="text-sm text-slate-700">Total dias: {deleteModal.days.length}</p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-sm font-medium text-amber-900">
                Esta accion eliminara definitivamente la solicitud.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="danger"
                type="button"
                onClick={() => void confirmDeleteCancelled()}
                disabled={isDeleteSubmitting}
              >
                {isDeleteSubmitting ? "Eliminando..." : "Eliminar solicitud"}
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

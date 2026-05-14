import { useEffect, useMemo, useState } from "react";
import type { UserSession } from "../../../core/types";
import { useRef } from "react";
import { Badge, Button, Input, Modal, Select, Table } from "../../../shared/ui";
import type {
  AdjustmentRequestStatus,
  AdjustmentRequestType,
  IncidentFlag,
  WorkdayAdjustmentRequest,
  WorkdayDeviceType,
  WorkdayIncidentJustification,
  WorkdayRecord,
  WorkdayStatus,
  WorkdayTrustLevel,
} from "../domain/types";

interface TimeControlFeatureProps {
  session: UserSession;
  mode: "worker" | "manager";
  workerView?: "overview" | "requests";
}

const STATUS_LABELS: Record<WorkdayStatus, string> = {
  OPEN: "Abierta",
  COMPLETED: "Completada",
  INCOMPLETE: "Incompleta",
  INCIDENT: "Incidencia",
};

const STATUS_CLASSES: Record<WorkdayStatus, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  INCOMPLETE: "bg-slate-100 text-slate-700",
  INCIDENT: "bg-rose-100 text-rose-800",
};

const CALENDAR_STATUS_BADGE_CLASSES: Record<WorkdayStatus, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  INCOMPLETE: "bg-slate-200 text-slate-700",
  INCIDENT: "bg-rose-100 text-rose-700",
};

const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentRequestStatus, string> = {
  PENDING_COORDINATOR: "Pendiente administración",
  PENDING_ADMIN: "Pendiente administración",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const ADJUSTMENT_STATUS_CLASSES: Record<AdjustmentRequestStatus, string> = {
  PENDING_COORDINATOR: "bg-amber-100 text-amber-800",
  PENDING_ADMIN: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentRequestType, string> = {
  CHECK_IN: "Entrada",
  CHECK_OUT: "Salida",
};

const ADJUSTMENT_TYPE_CLASSES: Record<AdjustmentRequestType, string> = {
  CHECK_IN: "bg-sky-100 text-sky-800",
  CHECK_OUT: "bg-violet-100 text-violet-800",
};

const INCIDENT_JUSTIFICATION_STATUS_LABELS: Record<
  WorkdayIncidentJustification["status"],
  string
> = {
  PENDING_COORDINATOR: "Pendiente administración",
  PENDING_ADMIN: "Pendiente administración",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const INCIDENT_JUSTIFICATION_STATUS_CLASSES: Record<
  WorkdayIncidentJustification["status"],
  string
> = {
  PENDING_COORDINATOR: "bg-amber-100 text-amber-800",
  PENDING_ADMIN: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  const [datePart, timePart = ""] = value.split(" ");
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return value;
  const time = timePart.slice(0, 5);
  return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
};

const formatHoursFromMinutes = (value: number): string => {
  const safeMinutes = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getCurrentMonthValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getTimeOnlyFromSqlDateTime = (value?: string | null): string | null => {
  if (!value) return null;
  const parts = value.split(" ");
  if (parts.length < 2) return null;
  return parts[1]?.slice(0, 5) ?? null;
};

const formatMonthLabel = (monthValue: string): string => {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return monthValue;

  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

const shiftMonthValue = (monthValue: string, delta: number): string => {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return getCurrentMonthValue();

  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(
    shifted.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
};

const formatTimeOnly = (value: string | null): string => {
  if (!value) return "-";
  const [, timePart = ""] = value.split(" ");
  return timePart.slice(0, 5) || "-";
};

const formatShortDate = (value: string | null): string => {
  if (!value) return "-";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

const getMonthDays = (monthValue: string): string[] => {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${String(month).padStart(2, "0")}-${day}`;
  });
};

const WEEKDAY_SHORT_LABELS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

const getWeekdayShortLabel = (workDate: string): string => {
  const [year, month, day] = workDate.split("-").map(Number);
  if (!year || !month || !day) return "";

  return WEEKDAY_SHORT_LABELS[
    new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  ];
};

const isWeekend = (workDate: string): boolean => {
  const weekday = getWeekdayShortLabel(workDate);
  return weekday === "sáb" || weekday === "dom";
};

const CALENDAR_WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

const getTodaySqlDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

const getRecordLine = (
  record: Pick<WorkdayRecord, "checkInAt" | "checkOutAt">
): string => {
  const checkIn = formatTimeOnly(record.checkInAt);
  const checkOut = formatTimeOnly(record.checkOutAt);
  return `${checkIn}-${checkOut === "-" ? "??" : checkOut}`;
};

const formatBalance = (minutes: number): string => {
  if (minutes === 0) return "0h";
  const sign = minutes > 0 ? "+" : "-";
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  return `${sign}${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
};

const getRecordDotClass = (record: WorkdayRecord): string => {
  switch (record.status) {
    case "COMPLETED":
      return "bg-emerald-500";
    case "INCIDENT":
      return "bg-rose-500";
    case "OPEN":
      return "bg-amber-500";
    case "INCOMPLETE":
      return "bg-slate-400";
    default:
      return "bg-slate-300";
  }
};

const getCalendarRecordClasses = (record: WorkdayRecord, isWeekendCell: boolean): string => {
  if (isWeekendCell) {
    return "bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/50 shadow-sm";
  }

  switch (record.status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-200/50 shadow-sm";
    case "INCIDENT":
      return "bg-rose-50 text-rose-900 ring-1 ring-inset ring-rose-200/50 shadow-sm";
    case "OPEN":
      return "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200/50 shadow-sm";
    case "INCOMPLETE":
      return "bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200/50 shadow-sm";
    default:
      return "bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200/50 shadow-sm";
  }
};

const getCalendarCellClasses = (
  isWeekendCell: boolean,
  isTodayCell: boolean,
): string => {
  if (isTodayCell) {
    return "border-violet-200 bg-violet-50/80 text-slate-900";
  }

  if (isWeekendCell) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  return "border-slate-200 bg-white text-slate-900";
};

const getCalendarStatusTextClass = (
  status: WorkdayStatus,
  isWeekendCell: boolean,
): string => {
  if (isWeekendCell) {
    return "text-slate-500";
  }

  switch (status) {
    case "COMPLETED":
      return "text-emerald-700";
    case "INCIDENT":
      return "text-rose-700";
    case "OPEN":
      return "text-amber-700";
    case "INCOMPLETE":
      return "text-slate-700";
    default:
      return "text-slate-700";
  }
};

const getRecordBarClass = (status: WorkdayStatus): string => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-400";
    case "INCIDENT":
      return "bg-rose-400";
    case "OPEN":
      return "bg-amber-400";
    case "INCOMPLETE":
      return "bg-slate-400";
    default:
      return "bg-slate-300";
  }
};

const getRecordBarWidth = (record: WorkdayRecord): string => {
  const maxReferenceMinutes = 12 * 60;
  const safeMinutes = record.workedMinutes > 0 ? record.workedMinutes : 60;
  const percent = Math.min(
    100,
    Math.max(14, (safeMinutes / maxReferenceMinutes) * 100),
  );

  return `${percent}%`;
};

const getPrimaryDayStatus = (records: WorkdayRecord[]): WorkdayStatus | null => {
  if (records.some((record) => record.status === "INCIDENT")) return "INCIDENT";
  if (records.some((record) => record.status === "INCOMPLETE"))
    return "INCOMPLETE";
  if (records.some((record) => record.status === "OPEN")) return "OPEN";
  if (records.some((record) => record.status === "COMPLETED"))
    return "COMPLETED";
  return null;
};

const DETAIL_LINK_CLASSES: Record<WorkdayStatus, string> = {
  COMPLETED: "text-emerald-600",
  OPEN: "text-amber-600",
  INCOMPLETE: "text-slate-500",
  INCIDENT: "text-rose-600",
};

const TRUST_LEVEL_CLASSES: Record<WorkdayTrustLevel, string> = {
  ALTA: "bg-emerald-100 text-emerald-800",
  MEDIA: "bg-sky-100 text-sky-800",
  BAJA: "bg-rose-100 text-rose-800",
  INVÁLIDA: "bg-rose-100 text-rose-800",
};

const TRUST_LEVEL_LABELS: Record<WorkdayTrustLevel, string> = {
  ALTA: "Correcta",
  MEDIA: "Revisar",
  BAJA: "Incidencia",
  INVÁLIDA: "Inválida",
};

const DEVICE_TYPE_LABELS: Record<WorkdayDeviceType, string> = {
  MOBILE: "Móvil",
  TABLET: "Tablet",
  DESKTOP: "Escritorio",
  UNKNOWN: "Desconocido",
};

const getDisplayTrustLevel = (record: WorkdayRecord): WorkdayTrustLevel =>
  record.trustLevel ?? "MEDIA";

const getRecordNetworkLabel = (record: WorkdayRecord): string => {
  if (!record.checkInIpAddress?.trim()) {
    return "Red no validada";
  }

  return record.isTrustedNetwork ? "Red confiable" : "Red externa";
};

const getRecordContextLine = (record: WorkdayRecord): string => {
  const parts: string[] = [];

  const deviceLabel = DEVICE_TYPE_LABELS[record.checkInDeviceType];
  if (record.checkInDeviceType !== "UNKNOWN") {
    parts.push(deviceLabel);
  }

  parts.push(getRecordNetworkLabel(record));

  if (record.checkInIpAddress?.trim()) {
    parts.push(record.checkInIpAddress.trim());
  }

  return parts.join(" · ") || "Sin detalles técnicos disponibles";
};

const getDisplayTrustLabel = (record: WorkdayRecord): string =>
  TRUST_LEVEL_LABELS[getDisplayTrustLevel(record)];

interface CalendarDayCell {
  workDate: string | null;
  dayNumber: number | null;
  isWeekend: boolean;
  isToday: boolean;
  records: WorkdayRecord[];
}

interface GeolocationCoordinatesPayload {
  latitude: number;
  longitude: number;
}

interface ManagerTodayExclusionsState {
  vacations: Array<{ id: string; name: string }>;
  permissions: Array<{ id: string; name: string }>;
  remoteWork: Array<{ id: string; name: string }>;
}

type WorkerRequestsTab = "incidents" | "requests";
type ManagerReviewTab = "requests" | "incidents" | "exclusions" | "records";

type ExclusionRequestType = "REMOTE_WORK" | "PERMISSION";
type ExclusionRequestStatus =
  | "PENDING_COORDINATOR"
  | "PENDING_ADMIN"
  | "APPROVED"
  | "REJECTED";

interface RemoteWorkRequestItem {
  id: string;
  userId: string;
  userName?: string | null;
  remoteWorkDate: string;
  reason: string;
  status: ExclusionRequestStatus;
  approverComment: string | null;
}

interface PermissionRequestItem {
  id: string;
  userId: string;
  userName?: string | null;
  permissionDate: string;
  reason: string;
  status: ExclusionRequestStatus;
  approverComment: string | null;
}

interface UnifiedExclusionRequestItem {
  id: string;
  kind: ExclusionRequestType;
  userId: string;
  userName?: string | null;
  requestDate: string;
  reason: string;
  status: ExclusionRequestStatus;
  approverComment: string | null;
}

const EXCLUSION_REQUEST_STATUS_LABELS: Record<ExclusionRequestStatus, string> = {
  PENDING_COORDINATOR: "Pendiente coordinador",
  PENDING_ADMIN: "Pendiente administración",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const EXCLUSION_REQUEST_STATUS_CLASSES: Record<ExclusionRequestStatus, string> = {
  PENDING_COORDINATOR: "bg-amber-100 text-amber-800",
  PENDING_ADMIN: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

const normalizeDateTimeLocalToSql = (value: string): string => {
  if (!value) return "";

  const normalized = value.replace("T", " ");
  return normalized.length === 16
    ? `${normalized}:00.000`
    : `${normalized}.000`;
};

const getStatusDetail = (record: WorkdayRecord): string => {
  if (record.status === "COMPLETED") {
    return "Fichaje completado sin problemas.";
  }

  if (record.status === "INCOMPLETE") {
    return "Falta fichaje de salida";
  }

  if (record.status !== "INCIDENT") {
    if (record.incidentFlags?.includes("OUT_OF_SCHEDULE")) {
      return "Fichaje fuera del rango horario permitido.";
    }
    if (record.incidentFlags?.includes("OUT_OF_ALLOWED_LOCATION")) {
      return "Fichaje fuera del punto de fichaje permitido.";
    }
    if (record.incidentFlags?.includes("DEVICE_NOT_ALLOWED")) {
      return "Fichaje realizado desde un dispositivo no permitido.";
    }
    return "-";
  }

  if (!record.incidentFlags?.length) {
    return "Incidencia detectada sin detalle adicional.";
  }

  const messages = record.incidentFlags.map((flag) => {
    switch (flag) {
      case "DURATION_TOO_SHORT":
        return "Duración demasiado corta";
      case "DURATION_TOO_LONG":
        return "Duración demasiado larga";
      case "NO_CHECKOUT":
        return "Falta fichaje de salida";
      case "OUT_OF_SCHEDULE":
        return "Fichaje fuera del rango horario permitido";
      case "OUT_OF_ALLOWED_LOCATION":
        return "Fichaje fuera del punto de fichaje permitido";
      case "DEVICE_NOT_ALLOWED":
        return "Fichaje desde dispositivo no permitido";
      default:
        return flag;
    }
  });

  return messages.join(", ");
};

const JUSTIFIABLE_INCIDENT_FLAGS: IncidentFlag[] = [
  "DURATION_TOO_SHORT",
  "DURATION_TOO_LONG",
  "OUT_OF_SCHEDULE",
  "OUT_OF_ALLOWED_LOCATION",
];

const hasJustifiableIncident = (flags: IncidentFlag[] | null): boolean =>
  Boolean(flags?.some((flag) => JUSTIFIABLE_INCIDENT_FLAGS.includes(flag)));

const getCurrentLocation = (): Promise<GeolocationCoordinatesPayload> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(
        new Error(
          "Este navegador no permite obtener la ubicación necesaria para fichar.",
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        reject(
          new Error(
            "Debes habilitar los permisos de ubicación para poder fichar.",
          ),
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });

export function TimeControlFeature({
  session,
  mode,
  workerView = "overview",
}: TimeControlFeatureProps) {
  const tabPanelAnimationStyle = {
    animation: "tcTabFadeSlide 220ms ease-out",
  } as const;

  const isWorkerMode = mode === "worker";
  const isManagerMode = mode === "manager";
  const showWorkerOverview = isWorkerMode && workerView === "overview";
  const showWorkerRequests = isWorkerMode && workerView === "requests";
  const viewedTabsStorageKey = useMemo(
    () => `time-control:viewed-tabs:${mode}:${session.email}`,
    [mode, session.email],
  );
  const [records, setRecords] = useState<WorkdayRecord[]>([]);
  const [viewedTabs, setViewedTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<WorkdayAdjustmentRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [incidentJustifications, setIncidentJustifications] = useState<
    WorkdayIncidentJustification[]
  >([]);
  const [dismissedApprovedIncidentRecordIds, setDismissedApprovedIncidentRecordIds] =
    useState<string[]>([]);
  const [incidentJustificationsLoading, setIncidentJustificationsLoading] =
    useState(true);
  const [incidentJustificationSubmitting, setIncidentJustificationSubmitting] =
    useState(false);
  const [pendingRequests, setPendingRequests] = useState<
    WorkdayAdjustmentRequest[]
  >([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(true);
  const [pendingIncidentJustifications, setPendingIncidentJustifications] =
    useState<WorkdayIncidentJustification[]>([]);
  const [pendingIncidentJustificationsLoading, setPendingIncidentJustificationsLoading] =
    useState(true);
  const [myRemoteWorkRequests, setMyRemoteWorkRequests] = useState<
    RemoteWorkRequestItem[]
  >([]);
  const [myPermissionRequests, setMyPermissionRequests] = useState<
    PermissionRequestItem[]
  >([]);
  const [myExclusionRequestsLoading, setMyExclusionRequestsLoading] =
    useState(true);
  const [pendingRemoteWorkRequests, setPendingRemoteWorkRequests] = useState<
    RemoteWorkRequestItem[]
  >([]);
  const [pendingPermissionRequests, setPendingPermissionRequests] = useState<
    PermissionRequestItem[]
  >([]);
  // "Máquina del tiempo" para el seguimiento diario
  const [trackerDate, setTrackerDate] = useState(getTodaySqlDate());
  const [pendingExclusionRequestsLoading, setPendingExclusionRequestsLoading] =
    useState(true);
  const [reviewSubmittingId, setReviewSubmittingId] = useState<string | null>(
    null,
  );
  const [reviewComments, setReviewComments] = useState<Record<string, string>>(
    {},
  );

  const [allWorkers, setAllWorkers] = useState<{ id: string; name: string }[]>(
    [],
  );

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue);
  const [managerUserFilter, setManagerUserFilter] = useState("");
  const [managerDateFrom, setManagerDateFrom] = useState("");
  const [managerDateTo, setManagerDateTo] = useState("");
  const [managerHourFrom, setManagerHourFrom] = useState("");
  const [managerHourTo, setManagerHourTo] = useState("");
  const [managerTrustFilter, setManagerTrustFilter] = useState<
    "" | WorkdayTrustLevel
  >("");

  // Filtros para las pestañas de solicitudes (tanto trabajador como manager)
  const [requestsDateFrom, setRequestsDateFrom] = useState("");
  const [requestsDateTo, setRequestsDateTo] = useState("");
  const [requestsStatusFilter, setRequestsStatusFilter] = useState("");
  const [requestsUserFilter, setRequestsUserFilter] = useState("");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("");
  const [incidentUserFilter, setIncidentUserFilter] = useState("");
  const [incidentRecordStatusFilter, setIncidentRecordStatusFilter] = useState<
    "" | WorkdayStatus
  >("");
  const [incidentRecordUserFilter, setIncidentRecordUserFilter] = useState("");
  const [incidentRecordDateFrom, setIncidentRecordDateFrom] = useState("");
  const [incidentRecordDateTo, setIncidentRecordDateTo] = useState("");
  const [incidentRecordTrustFilter, setIncidentRecordTrustFilter] = useState<
    "" | WorkdayTrustLevel
  >("");

  const clearRequestFilters = () => {
    setRequestsDateFrom("");
    setRequestsDateTo("");
    setRequestsStatusFilter("");
    setRequestsUserFilter("");
  };
  const clearIncidentFilters = () => {
    setIncidentStatusFilter("");
    setIncidentUserFilter("");
  };
  const clearIncidentRecordFilters = () => {
    setIncidentRecordStatusFilter("");
    setIncidentRecordUserFilter("");
    setIncidentRecordDateFrom("");
    setIncidentRecordDateTo("");
    setIncidentRecordTrustFilter("");
  };
  const openManagerRecordDetail = (record: WorkdayRecord) => {
    setSelectedDetailUserId(record.userId);
    setSelectedDetailDate(record.workDate);
  };
  const [requestType, setRequestType] =
    useState<AdjustmentRequestType>("CHECK_IN");
  const [requestedTime, setRequestedTime] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showExclusionRequestModal, setShowExclusionRequestModal] =
    useState(false);
  const [exclusionRequestType, setExclusionRequestType] =
    useState<ExclusionRequestType>("REMOTE_WORK");
  const [exclusionRequestDate, setExclusionRequestDate] = useState("");
  const [exclusionRequestReason, setExclusionRequestReason] = useState("");
  const [exclusionRequestSubmitting, setExclusionRequestSubmitting] =
    useState(false);
  const [workerRequestsTab, setWorkerRequestsTab] =
    useState<WorkerRequestsTab>("requests");
  const [managerReviewTab, setManagerReviewTab] =
    useState<ManagerReviewTab>("records");
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<WorkdayRecord | null>(null);
  const [selectedIncidentRecordId, setSelectedIncidentRecordId] = useState<
    string | null
  >(null);
  const [incidentJustificationReason, setIncidentJustificationReason] =
    useState("");
  const [incidentJustificationToDelete, setIncidentJustificationToDelete] =
    useState<WorkdayIncidentJustification | null>(null);
  const [deletingIncidentJustificationId, setDeletingIncidentJustificationId] =
    useState<string | null>(null);
  const [selectedDetailDate, setSelectedDetailDate] = useState<string | null>(null);
  const [selectedDetailUserId, setSelectedDetailUserId] = useState<string | null>(null);
  const [selectedOverflowDate, setSelectedOverflowDate] = useState<
    string | null
  >(null);
  const [managerDailyListType, setManagerDailyListType] = useState<
    "checked-in" | "missing" | "exclusions" | null
  >(null);
  const [showRemoteWorkModal, setShowRemoteWorkModal] = useState(false);
  const [showManagerIncidentsModal, setShowManagerIncidentsModal] =
    useState(false);
  const [managerTodayExclusions, setManagerTodayExclusions] =
    useState<ManagerTodayExclusionsState>({
      vacations: [],
      permissions: [],
      remoteWork: [],
    });

  const exportToExcel = async () => {
    if (!managerUserFilter) {
      setToast({
        tone: "error",
        message: "Debes seleccionar un trabajador para exportar el Excel.",
      });
      return;
    }

    const selectedWorkerRecords = records
      .filter((record) => record.userId === managerUserFilter)
      .sort((left, right) => left.workDate.localeCompare(right.workDate));

    if (selectedWorkerRecords.length === 0) {
      setToast({
        tone: "error",
        message: "No hay registros del trabajador seleccionado para exportar.",
      });
      return;
    }

    const dateFrom = managerDateFrom || selectedWorkerRecords[0]?.workDate;
    const dateTo =
      managerDateTo ||
      selectedWorkerRecords[selectedWorkerRecords.length - 1]?.workDate;

    if (!dateFrom || !dateTo) {
      setToast({
        tone: "error",
        message: "No se pudo determinar el rango de fechas para exportar.",
      });
      return;
    }

    showLoadingPopup("Generando Excel...");

    try {
      const params = new URLSearchParams({
        userId: managerUserFilter,
        dateFrom,
        dateTo,
      });

      if (managerHourFrom) {
        params.set("hourFrom", managerHourFrom);
      }

      if (managerHourTo) {
        params.set("hourTo", managerHourTo);
      }

      const response = await fetch(
        `/api/time-control/admin/export.xlsx?${params.toString()}`,
      );

      if (!response.ok) {
        const errorMessage = await readApiErrorMessage(
          response,
          "No se pudo generar el archivo Excel.",
        );
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const contentDisposition =
        response.headers.get("Content-Disposition") ?? "";
      const matchedFileName = contentDisposition.match(/filename="([^"]+)"/i);

      link.href = downloadUrl;
      link.download = matchedFileName?.[1] ?? "control-presencia.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Excel generado correctamente.",
      });
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo generar el archivo Excel.",
      });
    }
  };
  const [toast, setToast] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [actionPopup, setActionPopup] = useState<{
    tone: "loading";
    message: string;
  } | null>(null);
  const pendingRequestsSectionRef = useRef<HTMLDivElement | null>(null);
  const recordsSectionRef = useRef<HTMLDivElement | null>(null);

  const openRecord = useMemo(
    () => records.find((record) => record.status === "OPEN") ?? null,
    [records],
  );
  const filteredRecords = useMemo(
    () =>
      records.filter((record) => record.workDate.startsWith(selectedMonth)),
    [records, selectedMonth],
  );
  const totalWorkedMinutesInMonth = useMemo(
    () =>
      filteredRecords.reduce(
        (total, record) => total + record.workedMinutes,
        0,
      ),
    [filteredRecords],
  );

  const monthlyStats = useMemo(() => {
    const today = getTodaySqlDate();
    const monthDays = getMonthDays(selectedMonth);
    // Días laborables hasta hoy (para el balance actual)
    const workDaysSoFar = monthDays.filter(day => !isWeekend(day) && day <= today);
    // Días laborables totales del mes (para el objetivo mensual)
    const totalWorkDaysInMonth = monthDays.filter(day => !isWeekend(day));

    const expectedSoFar = workDaysSoFar.length * 480;
    const totalExpected = totalWorkDaysInMonth.length * 480;

    return {
      expectedSoFar,
      totalExpected,
      balance: totalWorkedMinutesInMonth - expectedSoFar
    };
  }, [selectedMonth, totalWorkedMinutesInMonth]);

  const incidentCountInMonth = useMemo(
    () =>
      filteredRecords.filter((record) => record.status === "INCIDENT").length,
    [filteredRecords],
  );

  const recordsByDate = useMemo(() => {
    const grouped = new Map<string, WorkdayRecord[]>();

    for (const record of records) {
      const current = grouped.get(record.workDate) ?? [];
      current.push(record);
      grouped.set(record.workDate, current);
    }

    return grouped;
  }, [records]);

  const calendarWeeks = useMemo<CalendarDayCell[][]>(() => {
    const monthDays = getMonthDays(selectedMonth);
    if (monthDays.length === 0) {
      return [];
    }

    const firstDate = monthDays[0];
    const firstDay = new Date(
      Date.UTC(
        Number(firstDate.slice(0, 4)),
        Number(firstDate.slice(5, 7)) - 1,
        Number(firstDate.slice(8, 10)),
      ),
    );
    const firstDayOffset = (firstDay.getUTCDay() + 6) % 7;
    const today = getTodaySqlDate();
    const cells: CalendarDayCell[] = [];

    for (let index = 0; index < firstDayOffset; index += 1) {
      cells.push({
        workDate: null,
        dayNumber: null,
        isWeekend: false,
        isToday: false,
        records: [],
      });
    }

    for (const workDate of monthDays) {
      const dayRecords = [...(recordsByDate.get(workDate) ?? [])].sort((a, b) =>
        a.checkInAt.localeCompare(b.checkInAt),
      );
      const dayNumber = Number(workDate.slice(-2));

      cells.push({
        workDate,
        dayNumber,
        isWeekend: isWeekend(workDate),
        isToday: workDate === today,
        records: dayRecords,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        workDate: null,
        dayNumber: null,
        isWeekend: false,
        isToday: false,
        records: [],
      });
    }

    const weeks: CalendarDayCell[][] = [];
    for (let index = 0; index < cells.length; index += 7) {
      weeks.push(cells.slice(index, index + 7));
    }

    return weeks;
  }, [recordsByDate, selectedMonth]);

  const monthRange = useMemo(() => {
    const days = getMonthDays(selectedMonth);
    if (!days.length) return { from: "", to: "" };
    return { from: days[0], to: days[days.length - 1] };
  }, [selectedMonth]);

  const endpointBase = useMemo(() => {
    const base = mode === "worker" ? "/api/time-control/me" : "/api/time-control/admin";
    const params = new URLSearchParams();
    if (mode === "worker") {
      if (monthRange.from) params.set("dateFrom", monthRange.from);
      if (monthRange.to) params.set("dateTo", monthRange.to);
    }
    return `${base}?${params.toString()}`;
  }, [mode, monthRange]);

  const canAccessManagementPanel = Boolean(
    session.role === "Admin" || session.role === "Responsable" || session.canManageTimeControlRequests,
  );
  const isFunctionalAdmin = Boolean(
    session.role === "Admin" || session.canManageTimeControlRequests,
  );
  const canReviewIncidentRequests = canAccessManagementPanel;
  const canReviewExclusionRequests = canAccessManagementPanel;
  const canViewTeamRecords = isFunctionalAdmin;
  const canReviewAdjustmentRequests = isFunctionalAdmin;
  const selectedDetailRecords = useMemo(() => {
    if (!selectedDetailDate) return [];
    const dayItems = recordsByDate.get(selectedDetailDate) ?? [];
    if (selectedDetailUserId) {
      return dayItems.filter((r) => r.userId === selectedDetailUserId);
    }
    return dayItems;
  }, [selectedDetailDate, recordsByDate, selectedDetailUserId]);

  const selectedDetailWorkedMinutes = useMemo(
    () => selectedDetailRecords.reduce((total, record) => total + record.workedMinutes, 0),
    [selectedDetailRecords]
  );
  const selectedOverflowRecords = selectedOverflowDate
    ? recordsByDate.get(selectedOverflowDate) ?? []
    : [];

  const workersFromRecords = useMemo(
    () =>
      Array.from(
        new Map(
          records.map((record) => [
            record.userId,
            {
              id: record.userId,
              name: record.userName ?? record.userId,
            },
          ])
        ).values(),
      ),
    [records],
  );

  const teamMembers =
    allWorkers.length > 0
      ? allWorkers
      : workersFromRecords.sort((left, right) =>
        left.name.localeCompare(right.name),
      );

  const teamMemberNameById = useMemo(
    () => new Map(teamMembers.map((member) => [member.id, member.name])),
    [teamMembers],
  );

  const getDisplayUserName = (userId: string, userName?: string | null): string => {
    const safeUserName = userName?.trim();
    if (safeUserName) {
      return safeUserName;
    }
    return teamMemberNameById.get(userId) ?? userId;
  };

  const excludedFromTodayTrackingIds = useMemo(
    () =>
      new Set([
        ...managerTodayExclusions.vacations.map((entry) => entry.id),
        ...managerTodayExclusions.permissions.map((entry) => entry.id),
      ]),
    [managerTodayExclusions.permissions, managerTodayExclusions.vacations],
  );

  const totalExpectedTodayUsers = useMemo(
    () =>
      teamMembers.filter((member) => !excludedFromTodayTrackingIds.has(member.id)),
    [excludedFromTodayTrackingIds, teamMembers],
  );

  const managerVisibleRecords = useMemo(() => {
    return records.filter((record) => {
      if (managerUserFilter && record.userId !== managerUserFilter) {
        return false;
      }
      if (managerDateFrom && record.workDate < managerDateFrom) {
        return false;
      }
      if (managerDateTo && record.workDate > managerDateTo) {
        return false;
      }

      const checkInTime = getTimeOnlyFromSqlDateTime(record.checkInAt);
      const checkOutTime = getTimeOnlyFromSqlDateTime(record.checkOutAt);

      if (managerHourFrom || managerHourTo) {
        if (!checkInTime) {
          return false;
        }

        const recordStartTime = checkInTime;
        const recordEndTime = checkOutTime ?? checkInTime;

        if (managerHourFrom && recordEndTime < managerHourFrom) {
          return false;
        }

        if (managerHourTo && recordStartTime > managerHourTo) {
          return false;
        }
      }

      if (managerTrustFilter && getDisplayTrustLevel(record) !== managerTrustFilter) {
        return false;
      }

      return true;
    });
  }, [
    managerDateFrom,
    managerDateTo,
    managerHourFrom,
    managerHourTo,
    managerTrustFilter,
    managerUserFilter,
    records,
  ]);
  const managerIncidentRecords = useMemo(
    () =>
      records.filter(
        (record) => record.status === "INCIDENT" || record.status === "INCOMPLETE",
      ),
    [records],
  );
  const filteredManagerIncidentRecords = useMemo(
    () =>
      managerIncidentRecords.filter((record) => {
        if (incidentRecordStatusFilter && record.status !== incidentRecordStatusFilter) {
          return false;
        }

        if (incidentRecordUserFilter && record.userId !== incidentRecordUserFilter) {
          return false;
        }

        if (incidentRecordDateFrom && record.workDate < incidentRecordDateFrom) {
          return false;
        }

        if (incidentRecordDateTo && record.workDate > incidentRecordDateTo) {
          return false;
        }

        if (
          incidentRecordTrustFilter &&
          getDisplayTrustLevel(record) !== incidentRecordTrustFilter
        ) {
          return false;
        }

        return true;
      }),
    [
      incidentRecordDateFrom,
      incidentRecordDateTo,
      incidentRecordStatusFilter,
      incidentRecordTrustFilter,
      incidentRecordUserFilter,
      managerIncidentRecords,
    ],
  );
  const managerIncidentUsersCount = useMemo(
    () => new Set(managerIncidentRecords.map((record) => record.userId)).size,
    [managerIncidentRecords],
  );
  const todaySqlDate = getTodaySqlDate();

  // 1. Obtenemos los IDs de los que han fichado en la fecha seleccionada
  const checkedInTrackerUserIds = useMemo(
    () =>
      new Set(
        records
          // Filtramos por la fecha seleccionada en el resumen diario
          .filter((record) => record.workDate === trackerDate)
          .map((record) => record.userId),
      ),
    [records, trackerDate],
  );

  const trackerDateRecordsMap = useMemo(() => {
    const map = new Map<string, WorkdayRecord[]>();
    records
      .filter((r) => r.workDate === trackerDate)
      .forEach((r) => {
        const userRecords = map.get(r.userId) || [];
        userRecords.push(r);
        map.set(r.userId, userRecords);
      });
    return map;
  }, [records, trackerDate]);

  // 2. Filtramos el equipo para ver quién SÍ ha fichado ese día
  const checkedInTodayUsers = useMemo(
    () =>
      totalExpectedTodayUsers.filter((member) =>
        checkedInTrackerUserIds.has(member.id),
      ),
    [checkedInTrackerUserIds, totalExpectedTodayUsers],
  );

  // 3. Filtramos el equipo para ver quién NO ha fichado ese día
  const notCheckedInTodayUsers = useMemo(
    () =>
      totalExpectedTodayUsers.filter((member) =>
        !checkedInTrackerUserIds.has(member.id),
      ),
    [checkedInTrackerUserIds, totalExpectedTodayUsers],
  );

  const remoteWorkTodayUsers = useMemo(() => {
    const remoteWorkIds = new Set(
      managerTodayExclusions.remoteWork.map((entry) => entry.id),
    );

    return teamMembers.filter((member) => remoteWorkIds.has(member.id));
  }, [managerTodayExclusions.remoteWork, teamMembers]);
  const remoteWorkCheckedInCount = useMemo(
    () =>
      remoteWorkTodayUsers.filter((member) =>
        checkedInTrackerUserIds.has(member.id) // <-- Aquí cambiamos el nombre
      ).length,
    [checkedInTrackerUserIds, remoteWorkTodayUsers], // <-- Y aquí también en las dependencias
  );
  const excludedTodayUsers = useMemo(
    () => [
      ...managerTodayExclusions.vacations,
      ...managerTodayExclusions.permissions,
    ],
    [managerTodayExclusions.permissions, managerTodayExclusions.vacations],
  );

  const managerDailyListUsers =
    managerDailyListType === "checked-in"
      ? checkedInTodayUsers
      : managerDailyListType === "missing"
        ? notCheckedInTodayUsers
        : managerDailyListType === "exclusions"
          ? excludedTodayUsers
          : [];

  const incidentJustificationsByRecordId = useMemo(
    () =>
      new Map(
        incidentJustifications
          .filter((justification) => !justification.hiddenByWorkerAt)
          .map((justification) => [justification.recordId, justification]),
      ),
    [incidentJustifications],
  );

  const hiddenApprovedIncidentRecordIds = useMemo(
    () =>
      new Set(
        [
          ...dismissedApprovedIncidentRecordIds,
          ...incidentJustifications
            .filter(
              (justification) =>
                justification.status === "APPROVED" &&
                Boolean(justification.hiddenByWorkerAt),
            )
            .map((justification) => justification.recordId),
        ],
      ),
    [dismissedApprovedIncidentRecordIds, incidentJustifications],
  );

  const justifiableIncidentRecords = useMemo(
    () =>
      records
        .filter(
          (record) =>
            record.status === "INCIDENT" &&
            hasJustifiableIncident(record.incidentFlags) &&
            !hiddenApprovedIncidentRecordIds.has(record.id),
        )
        .sort((left, right) => {
          const byDate = right.workDate.localeCompare(left.workDate);
          if (byDate !== 0) return byDate;
          return right.checkInAt.localeCompare(left.checkInAt);
        }),
    [hiddenApprovedIncidentRecordIds, records],
  );

  const myUnifiedExclusionRequests = useMemo<UnifiedExclusionRequestItem[]>(
    () =>
      [
        ...myRemoteWorkRequests.map((entry) => ({
          id: entry.id,
          kind: "REMOTE_WORK" as const,
          userId: entry.userId,
          userName: entry.userName,
          requestDate: entry.remoteWorkDate,
          reason: entry.reason,
          status: entry.status,
          approverComment: entry.approverComment,
        })),
        ...myPermissionRequests.map((entry) => ({
          id: entry.id,
          kind: "PERMISSION" as const,
          userId: entry.userId,
          userName: entry.userName,
          requestDate: entry.permissionDate,
          reason: entry.reason,
          status: entry.status,
          approverComment: entry.approverComment,
        })),
      ].sort((left, right) => right.requestDate.localeCompare(left.requestDate)),
    [myPermissionRequests, myRemoteWorkRequests],
  );

  const pendingUnifiedExclusionRequests = useMemo<UnifiedExclusionRequestItem[]>(
    () =>
      [
        ...pendingRemoteWorkRequests.map((entry) => ({
          id: entry.id,
          kind: "REMOTE_WORK" as const,
          userId: entry.userId,
          userName: entry.userName,
          requestDate: entry.remoteWorkDate,
          reason: entry.reason,
          status: entry.status,
          approverComment: entry.approverComment,
        })),
        ...pendingPermissionRequests.map((entry) => ({
          id: entry.id,
          kind: "PERMISSION" as const,
          userId: entry.userId,
          userName: entry.userName,
          requestDate: entry.permissionDate,
          reason: entry.reason,
          status: entry.status,
          approverComment: entry.approverComment,
        })),
      ].sort((left, right) => right.requestDate.localeCompare(left.requestDate)),
    [pendingPermissionRequests, pendingRemoteWorkRequests],
  );

  // --- LÓGICA DE FILTRADO PARA SOLICITUDES ---

  // 1. Filtrado para el TRABAJADOR
  const filteredWorkerRequests = useMemo(() => {
    return requests.filter((req) => {
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter) return false;
      return true;
    });
  }, [requests, requestsDateFrom, requestsDateTo, requestsStatusFilter]);

  const filteredWorkerExclusions = useMemo(() => {
    return myUnifiedExclusionRequests.filter((req) => {
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter) return false;
      return true;
    });
  }, [myUnifiedExclusionRequests, requestsDateFrom, requestsDateTo, requestsStatusFilter]);

  const filteredWorkerIncidents = useMemo(() => {
    return justifiableIncidentRecords.filter((record) => {
      if (requestsDateFrom && record.workDate < requestsDateFrom) return false;
      if (requestsDateTo && record.workDate > requestsDateTo) return false;
      // Las incidencias por justificar del trabajador no tienen estado de solicitud per se hasta que se envían
      return true;
    });
  }, [justifiableIncidentRecords, requestsDateFrom, requestsDateTo]);

  // 2. Filtrado para el MANAGER
  const filteredManagerRequests = useMemo(() => {
    return pendingRequests.filter((req) => {
      if (requestsUserFilter && req.userId !== requestsUserFilter) return false;
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter) return false;
      return true;
    });
  }, [pendingRequests, requestsDateFrom, requestsDateTo, requestsStatusFilter, requestsUserFilter]);

  const filteredManagerIncidents = useMemo(() => {
    return pendingIncidentJustifications.filter((req) => {
      // Necesitamos encontrar el record asociado para filtrar por fecha si es necesario
      if (incidentUserFilter && req.userId !== incidentUserFilter) return false;
      if (incidentStatusFilter && req.status !== incidentStatusFilter) return false;
      return true;
    });
  }, [pendingIncidentJustifications, incidentStatusFilter, incidentUserFilter]);

  const filteredManagerExclusions = useMemo(() => {
    return pendingUnifiedExclusionRequests.filter((req) => {
      if (requestsUserFilter && req.userId !== requestsUserFilter) return false;
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter) return false;
      return true;
    });
  }, [pendingUnifiedExclusionRequests, requestsDateFrom, requestsDateTo, requestsStatusFilter, requestsUserFilter]);

  const managerPendingCount = filteredManagerRequests.length;
  const pendingExclusionCount = filteredManagerExclusions.length;

  const managerMenuColsClass = canViewTeamRecords
    ? canReviewAdjustmentRequests
      ? "md:grid-cols-4"
      : "md:grid-cols-3"
    : canReviewAdjustmentRequests
      ? "md:grid-cols-3"
      : "md:grid-cols-2";

  useEffect(() => {
    if (!canViewTeamRecords && managerReviewTab === "records") {
      setManagerReviewTab(canReviewAdjustmentRequests ? "requests" : "incidents");
      return;
    }
    if (!canReviewAdjustmentRequests && managerReviewTab === "requests") {
      setManagerReviewTab("incidents");
    }
    if (!canReviewIncidentRequests && managerReviewTab === "incidents") {
      setManagerReviewTab(
        canReviewAdjustmentRequests ? "requests" : canReviewExclusionRequests ? "exclusions" : "records",
      );
      return;
    }
    if (!canReviewExclusionRequests && managerReviewTab === "exclusions") {
      setManagerReviewTab(canReviewAdjustmentRequests ? "requests" : "incidents");
    }
  }, [
    canReviewAdjustmentRequests,
    canReviewExclusionRequests,
    canReviewIncidentRequests,
    canViewTeamRecords,
    managerReviewTab,
  ]);

  const loadRecords = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(endpointBase, { signal });
      const data = (await response.json()) as {
        items?: WorkdayRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudieron cargar los registros.");
      }

      setRecords(data.items ?? []);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setToast({
          tone: "error",
          message:
            "La carga de registros está tardando demasiado. Recarga la pantalla o inténtalo de nuevo en unos segundos.",
        });
        return;
      }

      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los registros.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await fetch("/api/time-control/adjustments/me");
      const data = (await response.json()) as {
        items?: WorkdayAdjustmentRequest[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudieron cargar las solicitudes.");
      }

      setRequests(data.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las solicitudes.",
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadIncidentJustifications = async () => {
    if (!isWorkerMode) {
      setIncidentJustifications([]);
      setIncidentJustificationsLoading(false);
      return;
    }

    setIncidentJustificationsLoading(true);
    try {
      const response = await fetch("/api/time-control/incident-justifications/me");
      const data = (await response.json()) as {
        items?: WorkdayIncidentJustification[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudieron cargar las justificaciones.",
        );
      }

      setIncidentJustifications(data.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las justificaciones.",
      });
    } finally {
      setIncidentJustificationsLoading(false);
    }
  };

  const loadMyExclusionRequests = async () => {
    if (!isWorkerMode) {
      setMyRemoteWorkRequests([]);
      setMyPermissionRequests([]);
      setMyExclusionRequestsLoading(false);
      return;
    }

    setMyExclusionRequestsLoading(true);
    try {
      const [remoteResponse, permissionResponse] = await Promise.all([
        fetch("/api/remote-work/me"),
        fetch("/api/permissions/me"),
      ]);

      const remoteData = (await remoteResponse.json()) as {
        items?: RemoteWorkRequestItem[];
        error?: string;
      };
      const permissionData = (await permissionResponse.json()) as {
        items?: PermissionRequestItem[];
        error?: string;
      };

      if (!remoteResponse.ok) {
        throw new Error(
          remoteData.error ?? "No se pudieron cargar las solicitudes de teletrabajo.",
        );
      }
      if (!permissionResponse.ok) {
        throw new Error(
          permissionData.error ?? "No se pudieron cargar las solicitudes de permiso.",
        );
      }

      setMyRemoteWorkRequests(remoteData.items ?? []);
      setMyPermissionRequests(permissionData.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las solicitudes de teletrabajo/permiso.",
      });
    } finally {
      setMyExclusionRequestsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!canAccessManagementPanel || !canReviewAdjustmentRequests) {
      setPendingRequests([]);
      setPendingRequestsLoading(false);
      return;
    }

    setPendingRequestsLoading(true);
    try {
      const endpoint = isFunctionalAdmin
        ? "/api/time-control/adjustments/admin"
        : "/api/time-control/adjustments/coordinator";

      const response = await fetch(endpoint);
      const data = (await response.json()) as {
        items?: WorkdayAdjustmentRequest[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudieron cargar las solicitudes pendientes.",
        );
      }

      setPendingRequests(data.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las solicitudes pendientes.",
      });
    } finally {
      setPendingRequestsLoading(false);
    }
  };

  const loadPendingIncidentJustifications = async () => {
    if (!canAccessManagementPanel || !canReviewIncidentRequests) {
      setPendingIncidentJustifications([]);
      setPendingIncidentJustificationsLoading(false);
      return;
    }

    setPendingIncidentJustificationsLoading(true);
    try {
      const endpoint = isFunctionalAdmin
        ? "/api/time-control/incident-justifications/admin"
        : "/api/time-control/incident-justifications/coordinator";
      const response = await fetch(endpoint);
      const data = (await response.json()) as {
        items?: WorkdayIncidentJustification[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ??
          "No se pudieron cargar las justificaciones pendientes.",
        );
      }

      setPendingIncidentJustifications(data.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las justificaciones pendientes.",
      });
    } finally {
      setPendingIncidentJustificationsLoading(false);
    }
  };

  const loadPendingExclusionRequests = async () => {
    if (!canAccessManagementPanel || !canReviewExclusionRequests) {
      setPendingRemoteWorkRequests([]);
      setPendingPermissionRequests([]);
      setPendingExclusionRequestsLoading(false);
      return;
    }

    setPendingExclusionRequestsLoading(true);
    try {
      const remoteEndpoint = isFunctionalAdmin
        ? "/api/remote-work/admin-pending"
        : "/api/remote-work/coordinator";
      const permissionEndpoint = isFunctionalAdmin
        ? "/api/permissions/admin-pending"
        : "/api/permissions/coordinator";

      const [remoteResponse, permissionResponse] = await Promise.all([
        fetch(remoteEndpoint),
        fetch(permissionEndpoint),
      ]);

      const remoteData = (await remoteResponse.json()) as {
        items?: RemoteWorkRequestItem[];
        error?: string;
      };
      const permissionData = (await permissionResponse.json()) as {
        items?: PermissionRequestItem[];
        error?: string;
      };

      if (!remoteResponse.ok) {
        throw new Error(
          remoteData.error ?? "No se pudieron cargar solicitudes de teletrabajo.",
        );
      }
      if (!permissionResponse.ok) {
        throw new Error(
          permissionData.error ?? "No se pudieron cargar solicitudes de permiso.",
        );
      }

      setPendingRemoteWorkRequests(remoteData.items ?? []);
      setPendingPermissionRequests(permissionData.items ?? []);
    } catch (error) {
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar solicitudes de teletrabajo/permiso.",
      });
    } finally {
      setPendingExclusionRequestsLoading(false);
    }
  };

  const loadAllWorkers = async () => {
    if (mode !== "manager") return;

    try {
      const response = await fetch("/api/directory/users");
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      // 1. Le decimos a TypeScript que usersList es un array de cualquier tipo (any[])
      const usersList: any[] = Array.isArray(data.items) ? data.items : [];

      const normalized = usersList
        // 2. Le decimos que 'entry' puede ser 'any' (cualquier cosa)
        .map((entry: any) => ({
          id: String(entry.id ?? ""),
          name: String(entry.name ?? entry.email ?? entry.id ?? ""),
        }))
        // Como arriba devolvemos {id, name}, TypeScript ya sabe qué es 'entry' aquí abajo
        .filter((entry) => entry.id !== "" && entry.name !== "")
        // Y también sabe qué son 'left' y 'right'
        .sort((left, right) => left.name.localeCompare(right.name));

      setAllWorkers(normalized);
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
    }
  };

  const loadManagerTodayExclusions = async () => {
    if (!isManagerMode) return;

    try {
      const response = await fetch(
        `/api/time-control/exclusions/today?date=${encodeURIComponent(trackerDate)}`,
      );
      const data = (await response.json()) as {
        vacations?: Array<{ id: string; name: string }>;
        permissions?: Array<{ id: string; name: string }>;
        remoteWork?: Array<{ id: string; name: string }>;
      };

      if (!response.ok) {
        return;
      }

      setManagerTodayExclusions({
        vacations: Array.isArray(data.vacations) ? data.vacations : [],
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        remoteWork: Array.isArray(data.remoteWork) ? data.remoteWork : [],
      });
    } catch (error) {
      console.error("Error al cargar exclusiones del seguimiento diario:", error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    void loadRecords(controller.signal).finally(() => {
      window.clearTimeout(timeoutId);
    });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [endpointBase]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(viewedTabsStorageKey);
      if (!raw) {
        setViewedTabs([]);
        return;
      }

      const parsed = JSON.parse(raw);
      setViewedTabs(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
    } catch {
      setViewedTabs([]);
    }
  }, [viewedTabsStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(viewedTabsStorageKey, JSON.stringify(viewedTabs));
    } catch {
      // Ignore storage errors; the UI still works in-memory.
    }
  }, [viewedTabs, viewedTabsStorageKey]);

  useEffect(() => {
    if (!isWorkerMode) return;

    void loadRequests();
    void loadIncidentJustifications();
    void loadMyExclusionRequests();
  }, [isWorkerMode]);

  useEffect(() => {
    if (!isManagerMode) return;

    void loadPendingRequests();
    void loadPendingIncidentJustifications();
    void loadPendingExclusionRequests();
    void loadAllWorkers();
  }, [isManagerMode, canAccessManagementPanel, canReviewAdjustmentRequests, canReviewExclusionRequests, canReviewIncidentRequests]);

  useEffect(() => {
    if (!isManagerMode) return;
    void loadManagerTodayExclusions();
  }, [isManagerMode, trackerDate]);

  useEffect(() => {
    setSelectedDetailDate(null);
    setSelectedOverflowDate(null);
  }, [selectedMonth]);

  const readApiErrorMessage = async (
    response: Response,
    fallbackMessage: string,
  ): Promise<string> => {
    const responseText = await response.text();
    if (!responseText) {
      return fallbackMessage;
    }

    try {
      const parsed = JSON.parse(responseText) as { error?: string };
      return parsed.error ?? fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  const submitAction = async (
    endpoint: "/api/time-control/check-in" | "/api/time-control/check-out",
    successMessage: string,
  ) => {
    setSubmitting(true);
    showLoadingPopup("Comprobando ubicación...");
    try {
      const location = await getCurrentLocation();
      showLoadingPopup("Registrando fichaje...");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(location),
      });

      if (!response.ok) {
        const errorMessage = await readApiErrorMessage(
          response,
          "No se pudo completar la operación.",
        );
        throw new Error(errorMessage);
      }

      await response.json().catch(() => null);

      hideLoadingPopup();
      setToast({ tone: "success", message: successMessage });
      setShowLocationHelp(false);
      await loadRecords();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo completar la operación.";

      if (errorMessage.toLowerCase().includes("ubicación")) {
        setShowLocationHelp(true);
      }

      hideLoadingPopup();
      setToast({
        tone: "error",
        message: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToSection = (ref: { current: HTMLDivElement | null }) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const markTabAsViewed = (tab: string) => {
    setViewedTabs((current) =>
      current.includes(tab) ? current : [...current, tab],
    );
  };

  const handleTabClick = (tab: ManagerReviewTab) => {
    setManagerReviewTab(tab);
    markTabAsViewed(tab);
  };

  const adjustTrackerDate = (days: number) => {
    const current = new Date(trackerDate);
    current.setDate(current.getDate() + days);
    setTrackerDate(current.toISOString().split("T")[0]);
  };

  const handleWorkerTabClick = (tab: WorkerRequestsTab) => {
    setWorkerRequestsTab(tab);
    markTabAsViewed(`worker-${tab}`);
  };

  const openWorkerRequestsPage = () => {
    window.location.href = "/control-horario/solicitudes";
  };

  const showLoadingPopup = (message: string) => {
    setActionPopup({
      tone: "loading",
      message,
    });
  };

  const hideLoadingPopup = () => {
    setActionPopup(null);
  };

  const exclusionSummaryText = useMemo(() => {
    const summaryParts: string[] = [];

    if (managerTodayExclusions.vacations.length > 0) {
      summaryParts.push(
        `${managerTodayExclusions.vacations.length} vacación${managerTodayExclusions.vacations.length === 1 ? "" : "es"
        }`,
      );
    }

    if (managerTodayExclusions.permissions.length > 0) {
      summaryParts.push(
        `${managerTodayExclusions.permissions.length} permiso${managerTodayExclusions.permissions.length === 1 ? "" : "s"
        }`,
      );
    }

    if (summaryParts.length === 0) {
      return "Sin exclusiones por vacaciones o permisos aprobados.";
    }

    return `Se excluyen ${summaryParts.join(" y ")} aprobados en la fecha seleccionada.`;
  }, [managerTodayExclusions.permissions.length, managerTodayExclusions.vacations.length]);

  const resetExclusionRequestModal = () => {
    setShowExclusionRequestModal(false);
    setExclusionRequestType("REMOTE_WORK");
    setExclusionRequestDate("");
    setExclusionRequestReason("");
  };

  const submitAdjustmentRequest = async () => {
    setRequestSubmitting(true);
    showLoadingPopup("Enviando solicitud...");
    try {
      const trimmedReason = requestReason.trim();
      if (!trimmedReason) {
        throw new Error("Debes indicar un motivo para la solicitud.");
      }

      const response = await fetch("/api/time-control/adjustments/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestType,
          requestedTime: normalizeDateTimeLocalToSql(requestedTime),
          reason: trimmedReason,
        }),
      });

      const data = (await response.json()) as {
        item?: WorkdayAdjustmentRequest;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la solicitud.");
      }

      setRequestReason("");
      setRequestedTime("");
      setRequestType("CHECK_IN");
      setShowRequestModal(false);
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Solicitud enviada correctamente.",
      });
      await loadRequests();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo crear la solicitud.",
      });
    } finally {
      setRequestSubmitting(false);
    }
  };

  const submitExclusionRequest = async () => {
    setExclusionRequestSubmitting(true);
    showLoadingPopup("Enviando solicitud...");
    try {
      const trimmedReason = exclusionRequestReason.trim();
      if (!exclusionRequestDate) {
        throw new Error("Debes indicar una fecha.");
      }
      if (exclusionRequestDate < todaySqlDate) {
        throw new Error("No se puede solicitar teletrabajo o permiso en días anteriores.");
      }
      if (!trimmedReason) {
        throw new Error("Debes indicar un motivo.");
      }

      const isRemoteWork = exclusionRequestType === "REMOTE_WORK";
      const endpoint = isRemoteWork
        ? "/api/remote-work/request"
        : "/api/permissions/request";

      const body = isRemoteWork
        ? {
          remoteWorkDate: exclusionRequestDate,
          reason: trimmedReason,
        }
        : {
          permissionDate: exclusionRequestDate,
          reason: trimmedReason,
        };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo enviar la solicitud.");
      }

      resetExclusionRequestModal();
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Solicitud enviada correctamente.",
      });

      await loadMyExclusionRequests();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la solicitud.",
      });
    } finally {
      setExclusionRequestSubmitting(false);
    }
  };

  const reviewExclusionRequest = async (
    request: UnifiedExclusionRequestItem,
    status: "APPROVED" | "REJECTED",
  ) => {
    setReviewSubmittingId(request.id);
    showLoadingPopup(
      status === "APPROVED" ? "Aprobando solicitud..." : "Rechazando solicitud...",
    );
    try {
      const trimmedReviewComment = (reviewComments[request.id] ?? "").trim();
      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error("Debes indicar un motivo para rechazar la solicitud.");
      }

      const isCoordinatorStep = request.status === "PENDING_COORDINATOR";
      const endpoint = request.kind === "REMOTE_WORK"
        ? isCoordinatorStep
          ? `/api/remote-work/${request.id}/review-coordinator`
          : `/api/remote-work/${request.id}/review-admin`
        : isCoordinatorStep
          ? `/api/permissions/${request.id}/review-coordinator`
          : `/api/permissions/${request.id}/review-admin`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          comment: trimmedReviewComment,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo revisar la solicitud.");
      }

      setReviewComments((current) => ({
        ...current,
        [request.id]: "",
      }));

      hideLoadingPopup();
      setToast({
        tone: "success",
        message:
          status === "APPROVED"
            ? isCoordinatorStep
              ? "Solicitud enviada a administración."
              : "Solicitud aprobada correctamente."
            : "Solicitud rechazada correctamente.",
      });

      await Promise.all([
        loadPendingExclusionRequests(),
        loadMyExclusionRequests(),
        loadManagerTodayExclusions(),
      ]);
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo revisar la solicitud.",
      });
    } finally {
      setReviewSubmittingId(null);
    }
  };

  const submitIncidentJustification = async () => {
    if (!selectedIncidentRecordId) {
      return;
    }

    setIncidentJustificationSubmitting(true);
    showLoadingPopup("Enviando justificación...");
    try {
      const trimmedReason = incidentJustificationReason.trim();
      if (!trimmedReason) {
        throw new Error(
          "Debes indicar un motivo para justificar la incidencia.",
        );
      }

      const response = await fetch(
        "/api/time-control/incident-justifications/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recordId: selectedIncidentRecordId,
            reason: trimmedReason,
          }),
        },
      );

      const data = (await response.json()) as {
        item?: WorkdayIncidentJustification;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudo enviar la justificación de incidencia.",
        );
      }

      setSelectedIncidentRecordId(null);
      setIncidentJustificationReason("");
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Justificación enviada correctamente.",
      });
      await loadIncidentJustifications();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la justificación de incidencia.",
      });
    } finally {
      setIncidentJustificationSubmitting(false);
    }
  };

  const deleteIncidentJustification = async () => {
    if (!incidentJustificationToDelete) {
      return;
    }

    setDeletingIncidentJustificationId(incidentJustificationToDelete.id);
    showLoadingPopup("Ocultando notificación...");
    try {
      const response = await fetch(
        `/api/time-control/incident-justifications/${incidentJustificationToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "No se pudo ocultar la notificación.",
          ),
        );
      }

      const hiddenAt = new Date().toISOString().slice(0, 23).replace("T", " ");
      setIncidentJustifications((current) =>
        current.map((justification) =>
          justification.id === incidentJustificationToDelete.id
            ? { ...justification, hiddenByWorkerAt: hiddenAt }
            : justification,
        ),
      );
      setDismissedApprovedIncidentRecordIds((current) =>
        current.includes(incidentJustificationToDelete.recordId)
          ? current
          : [...current, incidentJustificationToDelete.recordId],
      );
      setIncidentJustificationToDelete(null);
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Notificación ocultada correctamente.",
      });
      await loadIncidentJustifications();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo ocultar la notificación.",
      });
    } finally {
      setDeletingIncidentJustificationId(null);
    }
  };

  const reviewRequest = async (
    requestId: string,
    status: Extract<AdjustmentRequestStatus, "APPROVED" | "REJECTED">,
  ) => {
    setReviewSubmittingId(requestId);
    showLoadingPopup(
      status === "APPROVED" ? "Aprobando solicitud..." : "Rechazando solicitud...",
    );
    try {
      const trimmedReviewComment = (reviewComments[requestId] ?? "").trim();

      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error("Debes indicar un motivo para rechazar la solicitud.");
      }

      const request = pendingRequests.find(r => r.id === requestId);
      const isLegacyCoordinatorPending =
        request?.status === "PENDING_COORDINATOR";

      const endpoint = `/api/time-control/adjustments/${requestId}/review-admin`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          comment: trimmedReviewComment,
        }),
      });

      const data = (await response.json()) as {
        item?: WorkdayAdjustmentRequest;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo revisar la solicitud.");
      }

      hideLoadingPopup();
      setToast({
        tone: "success",
        message:
          status === "APPROVED"
            ? (isLegacyCoordinatorPending
              ? "Solicitud antigua aprobada correctamente."
              : "Solicitud aprobada correctamente.")
            : "Solicitud rechazada correctamente.",
      });

      setReviewComments((current) => ({
        ...current,
        [requestId]: "",
      }));

      await Promise.all([loadPendingRequests(), loadRequests()]);
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo revisar la solicitud.",
      });
    } finally {
      setReviewSubmittingId(null);
    }
  };

  const reviewIncidentJustification = async (
    justificationId: string,
    status: Extract<
      WorkdayIncidentJustification["status"],
      "APPROVED" | "REJECTED"
    >,
  ) => {
    setReviewSubmittingId(justificationId);
    showLoadingPopup(
      status === "APPROVED"
        ? "Aprobando justificación..."
        : "Rechazando justificación...",
    );
    try {
      const trimmedReviewComment = (
        reviewComments[justificationId] ?? ""
      ).trim();

      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error(
          "Debes indicar un motivo para rechazar la justificación.",
        );
      }

      const justification = pendingIncidentJustifications.find(
        (entry) => entry.id === justificationId,
      );
      const isLegacyCoordinatorPending =
        justification?.status === "PENDING_COORDINATOR";
      const endpoint = `/api/time-control/incident-justifications/${justificationId}/review-admin`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          comment: trimmedReviewComment,
        }),
      });

      const data = (await response.json()) as {
        item?: WorkdayIncidentJustification;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudo revisar la justificación.",
        );
      }

      hideLoadingPopup();
      setToast({
        tone: "success",
        message:
          status === "APPROVED"
            ? isLegacyCoordinatorPending
              ? "Justificación antigua aprobada correctamente."
              : "Justificación aprobada correctamente."
            : "Justificación rechazada correctamente.",
      });

      setReviewComments((current) => ({
        ...current,
        [justificationId]: "",
      }));

      await Promise.all([
        loadPendingIncidentJustifications(),
        loadIncidentJustifications(),
      ]);
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo revisar la justificación.",
      });
    } finally {
      setReviewSubmittingId(null);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes tcTabFadeSlide {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <section className={`relative ${showWorkerOverview ? "flex flex-col gap-6 xl:flex-row xl:items-start" : "space-y-4"}`}>
        <div className="flex-1 min-w-0 space-y-4 overflow-hidden">
          {isWorkerMode ? (
            <>
              {showWorkerOverview ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-4 py-4">
                      <p className="text-xs text-slate-500">Estado de hoy</p>
                      <p className="mt-1.5 text-xl font-semibold text-slate-900">
                        {openRecord ? "Jornada abierta" : "Sin jornada abierta"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {openRecord
                          ? `Abierta desde ${formatDateTime(openRecord.checkInAt)}.`
                          : "Última entrada registrada."}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-4">
                      <p className="text-xs text-slate-500">
                        Horas de {formatMonthLabel(selectedMonth)}
                      </p>
                      <p className="mt-1.5 text-xl font-semibold text-slate-900">
                        {formatHoursFromMinutes(totalWorkedMinutesInMonth)}
                        <span className="ml-1.5 text-sm font-normal text-slate-400">
                          / {formatHoursFromMinutes(monthlyStats.totalExpected)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Trabajado vs objetivo mensual.
                      </p>
                    </div>

                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">
                          Fichaje actual
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${openRecord
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                              }`}
                          >
                            {openRecord ? "Jornada abierta" : "Sin jornada abierta"}
                          </span>
                          <p className="text-sm text-slate-600">
                            {openRecord
                              ? `Desde ${formatDateTime(openRecord.checkInAt)}`
                              : "Lista para registrar un nuevo fichaje."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {showLocationHelp ? (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                        <p className="font-medium text-slate-900">
                          Si el navegador bloquea la ubicación:
                        </p>
                        <ol className="mt-2 list-decimal space-y-1 pl-5">
                          <li>
                            Haz clic en el candado o en el icono de ubicación junto a la
                            barra de direcciones.
                          </li>
                          <li>
                            Cambia el permiso de ubicación a <strong>Permitir</strong>.
                          </li>
                          <li>Recarga la página y vuelve a intentar fichar.</li>
                        </ol>
                        <p className="mt-2 text-xs text-slate-500">
                          Si sigue sin funcionar, revisa también los permisos de
                          ubicación del navegador en la configuración del sistema.
                        </p>
                      </div>
                    ) : null}

                    {/* Acciones rápidas - SOLO MÓVIL (hasta 1280px) */}
                    <div className="xl:hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 space-y-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          Acciones rápidas
                        </p>
                        <p className="text-sm text-slate-500">
                          Gestión y consultas rápidas.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {isWorkerMode && (
                          <>
                            {!openRecord ? (
                              <Button
                                className="w-full bg-emerald-600 py-2.5 text-sm hover:bg-emerald-700"
                                onClick={() =>
                                  submitAction(
                                    "/api/time-control/check-in",
                                    "Entrada registrada correctamente.",
                                  )
                                }
                                disabled={submitting}
                              >
                                Fichar entrada
                              </Button>
                            ) : (
                              <Button
                                className="w-full bg-rose-600 py-2.5 text-sm hover:bg-rose-700"
                                onClick={() =>
                                  submitAction(
                                    "/api/time-control/check-out",
                                    "Salida registrada correctamente.",
                                  )
                                }
                                disabled={submitting}
                              >
                                Fichar salida
                              </Button>
                            )}
                          </>
                        )}

                        <Button
                          variant="secondary"
                          className="w-full py-2.5 text-sm"
                          onClick={() => setShowRequestModal(true)}
                        >
                          Solicitar fichaje
                        </Button>

                        <Button
                          variant="secondary"
                          className="w-full py-2.5 text-sm"
                          onClick={openWorkerRequestsPage}
                        >
                          Ver mis solicitudes
                        </Button>

                        <Button
                          variant="secondary"
                          disabled={submitting}
                          className="w-full py-2.5 text-sm"
                          onClick={() => setShowLocationHelp((current) => !current)}
                        >
                          {showLocationHelp ? "Ocultar ayuda" : "Ayuda ubicación"}
                        </Button>

                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="border-t border-slate-100 pt-5">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-slate-900">
                              Histórico de fichajes
                            </h4>
                            <p className="text-sm text-slate-600">
                              Aquí puedes consultar los fichajes del mes seleccionado,
                              incluidos los realizados en fin de semana.
                            </p>
                          </div>
                          <div className="flex items-center gap-1 self-start">
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setSelectedMonth((current) => shiftMonthValue(current, -1))
                              }
                            >
                              {"<"}
                            </Button>
                            <span className="min-w-[132px] text-center text-sm font-medium text-slate-700">
                              {formatMonthLabel(selectedMonth)}
                            </span>
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setSelectedMonth((current) => shiftMonthValue(current, 1))
                              }
                            >
                              {">"}
                            </Button>
                          </div>
                        </div>

                        {loading ? (
                          <p className="text-sm text-slate-500">Cargando registros...</p>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                Completada
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                                Incidencia
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                Abierta
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                                Incompleta
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-200 border border-slate-300" />
                                Fin de semana
                              </span>
                            </div>

                            <div className="overflow-x-auto pb-4 custom-scrollbar scrollbar-hide">
                              <div className="min-w-[600px] lg:min-w-full space-y-3">
                                <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                                  {CALENDAR_WEEKDAY_LABELS.map((label, index) => (
                                    <div
                                      key={label}
                                      className={`text-center text-xs font-semibold uppercase tracking-wide ${index >= 5 ? "text-rose-500" : "text-slate-500"}`}
                                    >
                                      {label}
                                    </div>
                                  ))}
                                </div>

                                {calendarWeeks.map((week, weekIndex) => (
                                  <div
                                    key={`week-${weekIndex}`}
                                    className="grid grid-cols-7 gap-1.5 sm:gap-3"
                                  >
                                    {week.map((cell, cellIndex) => {
                                      if (!cell.workDate || cell.dayNumber === null) {
                                        return (
                                          <div
                                            key={`empty-${weekIndex}-${cellIndex}`}
                                            className="min-h-[120px] rounded-2xl border border-transparent bg-transparent"
                                          />
                                        );
                                      }

                                      const hasDetail = cell.records.length > 0;
                                      const primaryStatus = getPrimaryDayStatus(
                                        cell.records,
                                      );
                                      const visibleRecords = cell.records.slice(0, 2);
                                      const hiddenRecordsCount = Math.max(
                                        cell.records.length - visibleRecords.length,
                                        0,
                                      );
                                      const baseCellClass = getCalendarCellClasses(
                                        cell.isWeekend,
                                        cell.isToday,
                                      );

                                      return (
                                        <div
                                          key={cell.workDate}
                                          className={`min-h-[90px] sm:min-h-[120px] rounded-xl sm:rounded-2xl border p-1.5 sm:p-3 shadow-sm ${baseCellClass} ${hasDetail
                                            ? "cursor-pointer transition hover:ring-2 hover:ring-rose-200"
                                            : ""
                                            }`}
                                          onClick={() =>
                                            hasDetail
                                              ? setSelectedDetailDate(cell.workDate)
                                              : undefined
                                          }
                                        >
                                          <div className="mb-2 flex justify-center">
                                            <div className="flex flex-col items-center text-center">
                                              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                                                {String(cell.dayNumber).padStart(2, "0")}
                                              </span>
                                              {cell.isToday ? (
                                                <span
                                                  className={`text-[9px] sm:text-[11px] font-medium ${cell.isWeekend
                                                    ? "text-violet-600"
                                                    : "text-violet-600"
                                                    }`}
                                                >
                                                  hoy
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>

                                          {cell.records.length === 0 ? (
                                            <div className="h-[40px] sm:h-[68px]" />
                                          ) : (
                                            <div className="space-y-2">
                                              {visibleRecords.map((record) => (
                                                <div
                                                  key={record.id}
                                                  className={`rounded-md sm:rounded-xl px-1 py-0.5 sm:px-2 sm:py-1.5 leading-tight transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${getCalendarRecordClasses(
                                                    record,
                                                    cell.isWeekend,
                                                  )}`}
                                                >
                                                  <div className="text-[8px] sm:text-[10px] font-semibold tracking-tight opacity-90 truncate">
                                                    {getRecordLine(record)}
                                                  </div>
                                                  <div className="mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-1.5 min-w-0">
                                                    <span
                                                      className={`h-1 w-1 sm:h-1.5 sm:w-1.5 flex-shrink-0 rounded-full ${getRecordDotClass(
                                                        record,
                                                      )}`}
                                                    />
                                                    <span className="truncate text-[8px] sm:text-[9px] font-medium opacity-80">
                                                      {STATUS_LABELS[record.status]}
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}

                                              {hiddenRecordsCount > 0 ? (
                                                <button
                                                  type="button"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedOverflowDate(cell.workDate);
                                                  }}
                                                  className={`rounded-lg border border-dashed px-1 py-0.5 text-center text-[8px] sm:text-[10px] font-normal w-full ${cell.isWeekend
                                                    ? "border-slate-300 bg-white text-slate-500"
                                                    : "border-slate-200 bg-white text-slate-500"
                                                    }`}
                                                >
                                                  +{hiddenRecordsCount}
                                                </button>
                                              ) : null}
                                            </div>
                                          )}

                                          {hasDetail && (
                                            <div className="mt-1 sm:mt-2 text-center text-[8px] sm:text-[10px] font-medium text-rose-600">
                                              Ver detalle
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {filteredRecords.length === 0 ? (
                              <p className="text-sm text-slate-500">
                                No hay fichajes registrados para el mes seleccionado.
                              </p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </>
              ) : null}

              {/* 📦 SÚPER CAJA DEL TRABAJADOR (Mis Solicitudes) */}
              {showWorkerRequests ? (
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">

                  {/* ----------------- PISO 1: MENÚ ANIMADO ----------------- */}
                  <div className="border-b border-slate-100 bg-white p-1.5">
                    <div className="grid grid-cols-2 gap-1 md:grid-cols-2">

                      {/* 1. FICHAJES */}
                      <button
                        type="button"
                        onClick={() => {
                          handleWorkerTabClick("requests");
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${workerRequestsTab === "requests"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                      >
                        Fichajes
                        {!viewedTabs.includes("worker-requests") && requests.length > 0 ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${workerRequestsTab === "requests" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}
                          >
                            {requests.length}
                          </span>
                        ) : null}
                      </button>

                      {/* 2. INCIDENCIAS */}
                      <button
                        type="button"
                        onClick={() => {
                          handleWorkerTabClick("incidents");
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${workerRequestsTab === "incidents"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                      >
                        Incidencias
                        {!viewedTabs.includes("worker-incidents") && justifiableIncidentRecords.length > 0 ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${workerRequestsTab === "incidents" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}
                          >
                            {justifiableIncidentRecords.length}
                          </span>
                        ) : null}
                      </button>

                    </div>
                  </div>

                  {workerRequestsTab === "incidents" ? (
                    <div
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                      style={tabPanelAnimationStyle}
                    >
                      <div className="mb-4 space-y-1">
                        <h3 className="text-base font-semibold text-slate-900">
                          Mis incidencias justificables
                        </h3>
                        <p className="text-sm text-slate-600">
                          Aquí puedes ver las incidencias que admiten justificación y
                          enviarla para revisión.
                        </p>
                      </div>

                      {loading || incidentJustificationsLoading ? (
                        <p className="text-sm text-slate-500">
                          Cargando incidencias justificables...
                        </p>
                      ) : justifiableIncidentRecords.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No tienes incidencias pendientes de justificar.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                            <Input
                              label="Desde"
                              type="date"
                              value={requestsDateFrom}
                              onChange={(e) => setRequestsDateFrom(e.target.value)}
                            />
                            <Input
                              label="Hasta"
                              type="date"
                              value={requestsDateTo}
                              onChange={(e) => setRequestsDateTo(e.target.value)}
                            />
                            <div className="flex items-end">
                              <Button
                                variant="secondary"
                                className="w-full h-[40px]"
                                onClick={clearRequestFilters}
                              >
                                Limpiar
                              </Button>
                            </div>
                          </div>

                          {loading || incidentJustificationsLoading ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                              Cargando incidencias justificables...
                            </p>
                          ) : filteredWorkerIncidents.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                              No hay incidencias que coincidan con los filtros.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {filteredWorkerIncidents.map((record) => {
                                const justification = incidentJustificationsByRecordId.get(
                                  record.id,
                                );

                                return (
                                  <div
                                    key={`incident-justification-${record.id}`}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                          <span className="font-medium text-slate-900">
                                            {formatShortDate(record.workDate)}
                                          </span>
                                          <span className="text-slate-400">•</span>
                                          <span className="text-slate-700">
                                            {getRecordLine(record)}
                                          </span>
                                          <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CALENDAR_STATUS_BADGE_CLASSES[record.status]}`}
                                          >
                                            {STATUS_LABELS[record.status]}
                                          </span>
                                          {justification ? (
                                            <span
                                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${INCIDENT_JUSTIFICATION_STATUS_CLASSES[justification.status]}`}
                                            >
                                              {
                                                INCIDENT_JUSTIFICATION_STATUS_LABELS[
                                                justification.status
                                                ]
                                              }
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="text-sm text-slate-700">
                                          {getStatusDetail(record)}
                                        </p>
                                      </div>

                                      {justification?.status === "APPROVED" ? (
                                        <button
                                          type="button"
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-semibold leading-none text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                          onClick={() =>
                                            setIncidentJustificationToDelete(
                                              justification,
                                            )
                                          }
                                          aria-label="Eliminar justificación aprobada"
                                          title="Eliminar justificación aprobada"
                                        >
                                          ×
                                        </button>
                                      ) : justification ? null : (
                                        <Button
                                          disabled={incidentJustificationSubmitting}
                                          onClick={() => {
                                            setSelectedIncidentRecordId(record.id);
                                            setIncidentJustificationReason("");
                                          }}
                                        >
                                          Justificar
                                        </Button>
                                      )}
                                    </div>

                                    {justification ? (
                                      <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 md:grid-cols-2">
                                        <p>
                                          <span className="font-medium text-slate-900">
                                            Motivo:
                                          </span>{" "}
                                          {justification.reason}
                                        </p>
                                        <p>
                                          <span className="font-medium text-slate-900">
                                            Respuesta:
                                          </span>{" "}
                                          {justification.adminComment ??
                                            justification.coordinatorComment ??
                                            "-"}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {workerRequestsTab === "requests" ? (
                    <div
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                      style={tabPanelAnimationStyle}
                    >
                      <div className="mb-4 space-y-1">
                        <h3 className="text-base font-semibold text-slate-900">
                          Mis solicitudes de fichaje
                        </h3>
                        <p className="text-sm text-slate-600">
                          Aquí puedes consultar el estado de las regularizaciones que hayas
                          pedido.
                        </p>
                      </div>

                      {requests.length === 0 && !requestsLoading ? (
                        <p className="text-sm text-slate-500">
                          Todavía no has enviado ninguna solicitud.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
                            <Input
                              label="Desde"
                              type="date"
                              value={requestsDateFrom}
                              onChange={(e) => setRequestsDateFrom(e.target.value)}
                            />
                            <Input
                              label="Hasta"
                              type="date"
                              value={requestsDateTo}
                              onChange={(e) => setRequestsDateTo(e.target.value)}
                            />
                            <Select
                              id="requestsStatusFilter"
                              label="Estado"
                              value={requestsStatusFilter}
                              onChange={(e) => setRequestsStatusFilter(e.target.value)}
                              options={[
                                { value: "", label: "Todos" },
                                { value: "PENDING_COORDINATOR", label: "Pendiente Administración (legado)" },
                                { value: "PENDING_ADMIN", label: "Pendiente Administración" },
                                { value: "APPROVED", label: "Aprobada" },
                                { value: "REJECTED", label: "Rechazada" },
                              ]}
                            />
                            <div className="flex items-end">
                              <Button
                                variant="secondary"
                                className="w-full h-[40px]"
                                onClick={clearRequestFilters}
                              >
                                Limpiar
                              </Button>
                            </div>
                          </div>

                          {requestsLoading ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                              Cargando solicitudes...
                            </p>
                          ) : filteredWorkerRequests.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                              No hay solicitudes que coincidan con los filtros.
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {/* Mobile Card View */}
                              <div className="grid gap-4 md:hidden">
                                {filteredWorkerRequests.map((request) => (
                                  <div key={request.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all active:scale-[0.99]">
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</p>
                                        <p className="text-sm font-bold text-slate-900">{formatShortDate(request.requestDate)}</p>
                                      </div>
                                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ADJUSTMENT_STATUS_CLASSES[request.status]}`}>
                                        {ADJUSTMENT_STATUS_LABELS[request.status]}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4 rounded-xl bg-slate-50 p-3">
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Tipo</p>
                                        <p className="text-xs font-semibold text-slate-700">{ADJUSTMENT_TYPE_LABELS[request.requestType]}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Hora</p>
                                        <p className="text-xs font-semibold text-slate-700">{formatTimeOnly(request.requestedTime)}</p>
                                      </div>
                                    </div>

                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Motivo</p>
                                        <p className="text-sm text-slate-600 leading-relaxed">{request.reason}</p>
                                      </div>
                                      {(request.status === "REJECTED" || request.adminComment || request.coordinatorComment) && (
                                        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                                          {request.status === "REJECTED" && (
                                            <div className="mb-2">
                                              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tight mb-1">Rechazada por</p>
                                              <p className="text-xs font-semibold text-rose-700">
                                                {request.reviewedByAdminId ? "Administración" : request.reviewedByCoordinatorId ? "Coordinación" : "-"}
                                              </p>
                                            </div>
                                          )}
                                          {(request.adminComment || request.coordinatorComment) && (
                                            <div>
                                              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tight mb-1">Nota de revisión</p>
                                              <p className="text-xs text-rose-600 leading-relaxed italic">
                                                "{request.adminComment ?? request.coordinatorComment}"
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Desktop Table View */}
                              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                  <thead>
                                    <tr className="bg-slate-50 text-left text-slate-500">
                                      <th className="py-3 pr-4 pl-4 font-semibold uppercase tracking-wider text-[10px]">Fecha</th>
                                      <th className="py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Tipo</th>
                                      <th className="py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Hora</th>
                                      <th className="py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Estado</th>
                                      <th className="min-w-[200px] py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Motivo</th>
                                      <th className="min-w-[120px] py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Rechazada</th>
                                      <th className="py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Nota</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredWorkerRequests.map((request) => (
                                      <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 pr-4 pl-4 align-top font-medium text-slate-900">
                                          {formatShortDate(request.requestDate)}
                                        </td>
                                        <td className="py-4 pr-4 align-top">
                                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ADJUSTMENT_TYPE_CLASSES[request.requestType]}`}>
                                            {ADJUSTMENT_TYPE_LABELS[request.requestType]}
                                          </span>
                                        </td>
                                        <td className="py-4 pr-4 align-top text-slate-600 tabular-nums">
                                          {formatTimeOnly(request.requestedTime)}
                                        </td>
                                        <td className="py-4 pr-4 align-top">
                                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ADJUSTMENT_STATUS_CLASSES[request.status]}`}>
                                            {ADJUSTMENT_STATUS_LABELS[request.status]}
                                          </span>
                                        </td>
                                        <td className="py-4 pr-4 align-top text-slate-600 max-w-[250px]">
                                          <p className="whitespace-normal leading-relaxed">{request.reason}</p>
                                        </td>
                                        <td className="py-4 pr-4 align-top">
                                          {request.status !== "REJECTED" ? (
                                            "-"
                                          ) : (
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${request.reviewedByAdminId ? "bg-rose-100 text-rose-700" : "bg-orange-100 text-orange-700"}`}>
                                              {request.reviewedByAdminId ? "Admin" : "Coordinador"}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-4 pr-4 align-top text-slate-500 italic max-w-[200px]">
                                          <p className="whitespace-normal leading-relaxed">{request.adminComment ?? request.coordinatorComment ?? "-"}</p>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}

                </div>
              ) : null}
            </>
          ) : null}

          {isManagerMode && canAccessManagementPanel ? (
            <>
              {!isFunctionalAdmin ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
                  Vista de coordinación activa: aquí solo verás incidencias relacionadas con horas y solicitudes de tu ámbito.
                </div>
              ) : null}

              <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {/* 1. SOLICITUDES PENDIENTES */}
                  {canReviewAdjustmentRequests ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleTabClick("requests");
                        scrollToSection(pendingRequestsSectionRef);
                      }}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-indigo-50/60 transition-transform duration-500 group-hover:scale-[1.8]" />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                            </svg>
                          </div>
                          <span className="text-3xl font-black tracking-tight text-slate-900">
                            {managerPendingCount}
                          </span>
                        </div>

                        <div className="mt-5">
                          <h3 className="text-base font-bold text-slate-900">Solicitudes pendientes</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {managerPendingCount === 0 ? "Todo al día." : "Requieren tu aprobación inmediata."}
                          </p>
                        </div>

                        <div className="mt-auto pt-6">
                          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                            <span className="border-b border-indigo-100 group-hover:border-indigo-500 transition-colors">Abrir solicitudes</span>
                            <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                          </span>
                        </div>
                      </div>
                    </button>
                  ) : null}

                  {/* 2. TELETRABAJO Y PERMISOS */}
                  <button
                    type="button"
                    onClick={() => {
                      handleTabClick("exclusions");
                      scrollToSection(pendingRequestsSectionRef);
                    }}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-sky-300 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-sky-50/60 transition-transform duration-500 group-hover:scale-[1.8]" />

                    <div className="relative flex h-full flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                          </svg>
                        </div>
                        <span className="text-3xl font-black tracking-tight text-slate-900">
                          {pendingExclusionCount}
                        </span>
                      </div>

                      <div className="mt-5">
                        <h3 className="text-base font-bold text-slate-900">Teletrabajo y permisos</h3>
                        <p className="mt-1 text-xs text-slate-500">Gestión de ausencias y trabajo remoto.</p>
                      </div>

                      <div className="mt-auto pt-6">
                        <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-sky-600">
                          <span className="border-b border-sky-100 group-hover:border-sky-500 transition-colors">Revisar permisos</span>
                          <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* 3. ANOMALÍAS DEL EQUIPO */}
                  <button
                    type="button"
                    onClick={() => setShowManagerIncidentsModal(true)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-50/60 transition-transform duration-500 group-hover:scale-[1.8]" />

                    <div className="relative flex h-full flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <span className="text-3xl font-black tracking-tight text-slate-900">
                          {managerIncidentRecords.length}
                        </span>
                      </div>

                      <div className="mt-5">
                        <h3 className="text-base font-bold text-slate-900">Fichajes con incidencia</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          <span className="font-semibold text-orange-600">{managerIncidentUsersCount}</span> {managerIncidentUsersCount === 1 ? "trabajador" : "trabajadores"} con anomalías.
                        </p>
                      </div>

                      <div className="mt-auto pt-6">
                        <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-orange-600">
                          <span className="border-b border-orange-100 group-hover:border-orange-500 transition-colors">Abrir incidencias</span>
                          <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                {canViewTeamRecords ? (
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Resumen diario
                        </p>
                        <h3 className="text-base font-semibold text-slate-900">
                          Seguimiento de asistencia
                        </h3>
                        <p className="text-sm text-slate-600">
                          Consulta quién ha fichado y quién falta en la fecha seleccionada.
                        </p>
                      </div>

                      {/* Selector de fecha para seguimiento */}
                      <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-sm border border-slate-200">
                        <button
                          type="button"
                          onClick={() => adjustTrackerDate(-1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="flex items-center gap-2 px-2 border-x border-slate-100">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                            Fecha
                          </label>
                          <input
                            type="date"
                            value={trackerDate}
                            onChange={(e) => setTrackerDate(e.target.value)}
                            className="border-none bg-transparent text-sm font-semibold text-slate-900 focus:outline-none focus:ring-0 cursor-pointer"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustTrackerDate(1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {/* 1. FICHADOS */}
                      <div
                        onClick={() => setManagerDailyListType("checked-in")}
                        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md active:scale-[0.98]"
                      >
                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-50/60 transition-transform duration-500 group-hover:scale-[1.8]" />

                        <div className="relative flex h-full flex-col">
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                              {/* Icono de Check / Usuario */}
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                              </svg>
                            </div>
                            <span className="text-3xl font-black tracking-tight text-slate-900">
                              {checkedInTodayUsers.length}
                            </span>
                          </div>

                          <div className="mt-5">
                            <h3 className="text-base font-bold text-slate-900">Fichados hoy</h3>
                            {/* Barra de progreso sutil integrada */}
                            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                                style={{ width: `${Math.min(100, (checkedInTodayUsers.length / (totalExpectedTodayUsers.length || 1)) * 100)}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-500 italic">
                              {checkedInTodayUsers.length} de {totalExpectedTodayUsers.length} esperados
                            </p>
                          </div>

                          <div className="mt-auto pt-6">
                            <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                              <span className="border-b border-emerald-100 group-hover:border-emerald-500 transition-colors">Ver lista de entrada</span>
                              <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. SIN FICHAR */}
                      <div
                        onClick={() => setManagerDailyListType("missing")}
                        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-rose-300 hover:shadow-md active:scale-[0.98]"
                      >
                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-rose-50/60 transition-transform duration-500 group-hover:scale-[1.8]" />

                        <div className="relative flex h-full flex-col">
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
                              {/* Icono de Reloj / Alerta */}
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-3xl font-black tracking-tight text-slate-900">
                              {notCheckedInTodayUsers.length}
                            </span>
                          </div>

                          <div className="mt-5">
                            <h3 className="text-base font-bold text-slate-900">Sin fichar</h3>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-rose-500 transition-all duration-700"
                                style={{ width: `${Math.min(100, (notCheckedInTodayUsers.length / (totalExpectedTodayUsers.length || 1)) * 100)}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Pendientes de iniciar jornada.</p>
                          </div>

                          <div className="mt-auto pt-6">
                            <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-rose-600">
                              <span className="border-b border-rose-100 group-hover:border-rose-500 transition-colors">Revisar ausencias</span>
                              <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 3. TOTAL / PLANTILLA ESPERADA */}
                      <div
                        onClick={() => setManagerDailyListType("exclusions")}
                        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-400 hover:shadow-md active:scale-[0.98]"
                      >
                        {/* Efecto de círculo de fondo */}
                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-slate-50 transition-transform duration-500 group-hover:scale-[1.8]" />

                        <div className="relative flex h-full flex-col">
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-200">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                              </svg>
                            </div>
                            <span className="text-3xl font-black tracking-tight text-slate-900">
                              {totalExpectedTodayUsers.length}
                            </span>
                          </div>

                          <div className="mt-5">
                            <h3 className="text-base font-bold text-slate-900">Plantilla esperada</h3>
                            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                              {exclusionSummaryText}
                            </p>
                          </div>

                          {/* SECCIÓN DE BOTONES INFERIORES (Donde estaba la cruz) */}
                          <div className="mt-auto pt-6">
                            <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-slate-600">
                              <span className="border-b border-slate-100 group-hover:border-slate-500 transition-colors">Abrir detalle diario</span>
                              <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* 3. CUADRANTE DIARIO */}
              {canViewTeamRecords ? (
                <div className="mb-12 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md" id="cuadrante-diario">
                  {/* Cabecera del Cuadrante */}
                  <div className="border-b border-slate-100 p-8">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-1 rounded-full bg-indigo-600" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Visualizador Temporal</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                          Cuadrante de fichajes
                        </h3>
                        <p className="text-sm text-slate-500">
                          Distribución horaria de la actividad del equipo por slots de 60 minutos.
                        </p>
                      </div>

                      {/* Navegación de Fecha Refinada */}
                      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() => adjustTrackerDate(-1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:text-indigo-600 active:scale-90"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className="px-4">
                          <input
                            type="date"
                            value={trackerDate}
                            onChange={(e) => setTrackerDate(e.target.value)}
                            className="bg-transparent text-sm font-black uppercase tracking-tight text-slate-700 outline-none cursor-pointer"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => adjustTrackerDate(1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:text-indigo-600 active:scale-90"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Leyenda Evolucionada */}
                    {/* Leyenda del cuadrante con estilo Soft & Glass */}
                    <div className="mb-8 flex flex-wrap items-center gap-3 border-t border-slate-50 pt-6">
                      <span className="mr-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Estados:
                      </span>
                      {[
                        { border: "border-emerald-500", dot: "bg-emerald-500", text: "text-emerald-700", label: "Completada" },
                        { border: "border-amber-500", dot: "bg-amber-500", text: "text-amber-700", label: "Abierta" },
                        { border: "border-rose-500", dot: "bg-rose-500", text: "text-rose-700", label: "Incidencia" },
                        { border: "border-sky-500", dot: "bg-sky-500", text: "text-sky-700", label: "Revisar" },
                        { border: "border-slate-400", dot: "bg-slate-400", text: "text-slate-600", label: "Incompleta" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-1.5 rounded-full border ${item.border} bg-transparent px-2.5 py-1 transition-all hover:scale-105`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
                          <span className={`text-[10px] font-semibold ${item.text}`}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rejilla Horaria con diseño de Slots */}
                  <div className="relative bg-white p-4">
                    <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="sticky left-0 z-30 min-w-[240px] border-b border-r border-slate-100 bg-slate-50 px-6 py-4 text-left font-black uppercase tracking-widest text-slate-400">
                              Trabajador
                            </th>
                            {Array.from({ length: 15 }, (_, i) => i + 6).map((h) => (
                              <th key={`h-${h}`} className="min-w-[64px] border-b border-slate-100 px-2 py-4 text-center font-bold text-slate-400">
                                {String(h).padStart(2, "0")}:00
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map((member) => {
                            const userRecords = trackerDateRecordsMap.get(member.id) || [];
                            return (
                              <tr key={`q-row-${member.id}`} className="group hover:bg-slate-50/30">
                                <td className="sticky left-0 z-20 min-w-[240px] border-b border-r border-slate-100 bg-white px-6 py-4 font-bold text-slate-700 group-hover:bg-slate-50/80 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors" />
                                    {member.name}
                                  </div>
                                </td>
                                {Array.from({ length: 15 }, (_, i) => i + 6).map((h) => {
                                  const matchingRecord = userRecords.find(r => {
                                    const [_, time] = r.checkInAt.split(" ");
                                    const inH = parseInt(time.split(":")[0], 10);
                                    let outH = 23;
                                    if (r.checkOutAt) {
                                      const [__, outTime] = r.checkOutAt.split(" ");
                                      outH = parseInt(outTime.split(":")[0], 10);
                                    } else if (r.status === "OPEN" && r.workDate === getTodaySqlDate()) {
                                      outH = new Date().getHours();
                                    }
                                    return h >= inH && h <= outH;
                                  });

                                  let bgColor = "bg-slate-50/50";
                                  let opacity = "opacity-100";

                                  if (matchingRecord) {
                                    if (matchingRecord.requiresAdminValidation && matchingRecord.adminValidationStatus === "PENDING") {
                                      bgColor = "bg-sky-500 shadow-sky-100";
                                    } else {
                                      switch (matchingRecord.status) {
                                        case "COMPLETED": bgColor = "bg-emerald-500 shadow-emerald-100"; break;
                                        case "INCIDENT": bgColor = "bg-rose-500 shadow-rose-100"; break;
                                        case "INCOMPLETE": bgColor = "bg-slate-400 shadow-slate-100"; break;
                                        case "OPEN": bgColor = "bg-amber-500 shadow-amber-100"; break;
                                      }
                                    }
                                  } else {
                                    opacity = "opacity-20";
                                  }

                                  return (
                                    <td key={`cell-${member.id}-${h}`} className="border-b border-slate-100 p-1.5">
                                      <div
                                        onClick={() => matchingRecord && setSelectedRecordForDetail(matchingRecord)}
                                        title={matchingRecord ? `Ver detalle de ${member.name}` : ""}
                                        className={`h-9 w-full rounded-lg transition-all duration-300 ${bgColor} ${opacity} ${matchingRecord ? "shadow-lg scale-[1.02] ring-1 ring-white/20 cursor-pointer hover:brightness-110 active:scale-95" : "hover:bg-slate-200"
                                          }`}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}


              <div
                ref={pendingRequestsSectionRef}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 bg-white p-1.5">
                  <div className={`grid gap-1 ${managerMenuColsClass}`}>
                    {/* 1. SOLICITUDES DE FICHAJE */}
                    {canReviewAdjustmentRequests ? (
                      <button
                        type="button"
                        onClick={() => handleTabClick("requests")}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${managerReviewTab === "requests"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                      >
                        Fichajes
                        {!viewedTabs.includes("requests") && pendingRequests.length > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${managerReviewTab === "requests" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`}>
                            {pendingRequests.length}
                          </span>
                        )}
                      </button>
                    ) : null}

                    {/* 2. INCIDENCIAS JUSTIFICADAS */}
                    <button
                      type="button"
                      onClick={() => handleTabClick("incidents")}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${managerReviewTab === "incidents"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      Incidencias
                      {!viewedTabs.includes("incidents") && pendingIncidentJustifications.length > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${managerReviewTab === "incidents" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`}>
                          {pendingIncidentJustifications.length}
                        </span>
                      )}
                    </button>

                    {/* 3. REGISTROS DE EQUIPO */}
                    {canViewTeamRecords ? (
                      <button
                        type="button"
                        onClick={() => handleTabClick("records")}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${managerReviewTab === "records"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                      >
                        Registros
                      </button>
                    ) : null}

                    {/* 4. TELETRABAJO Y PERMISOS */}
                    <button
                      type="button"
                      onClick={() => handleTabClick("exclusions")}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${managerReviewTab === "exclusions"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      Permisos
                      {!viewedTabs.includes("exclusions") && pendingExclusionCount > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${managerReviewTab === "exclusions" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`}>
                          {pendingExclusionCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {canViewTeamRecords && managerReviewTab === "records" ? (
                  <div
                    className="border-b border-slate-100 bg-slate-50/50 p-5"
                    style={tabPanelAnimationStyle}
                  >
                    <div className="mb-4 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Filtros
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">
                        Filtros de registros
                      </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                      <Input
                        label="Desde"
                        type="date"
                        value={managerDateFrom}
                        onChange={(event) => setManagerDateFrom(event.target.value)}
                      />
                      <Input
                        label="Hasta"
                        type="date"
                        value={managerDateTo}
                        onChange={(event) => setManagerDateTo(event.target.value)}
                      />
                      <Input
                        label="Hora desde"
                        type="time"
                        value={managerHourFrom}
                        onChange={(event) => setManagerHourFrom(event.target.value)}
                      />
                      <Input
                        label="Hora hasta"
                        type="time"
                        value={managerHourTo}
                        onChange={(event) => setManagerHourTo(event.target.value)}
                      />

                      <Select
                        id="managerUserFilter"
                        label="Trabajador"
                        value={managerUserFilter}
                        onChange={(event) => setManagerUserFilter(event.target.value)}
                        options={[
                          { value: "", label: "Todos" },
                          ...teamMembers.map((member) => ({
                            value: member.id,
                            label: member.name,
                          })),
                        ]}
                      />

                      <Select
                        id="managerTrustFilter"
                        label="Validación"
                        value={managerTrustFilter}
                        onChange={(event) =>
                          setManagerTrustFilter(event.target.value as "" | WorkdayTrustLevel)
                        }
                        options={[
                          { value: "", label: "Todas" },
                          { value: "ALTA", label: "Correcta" },
                          { value: "MEDIA", label: "Revisar" },
                          { value: "BAJA", label: "Incidencia" },
                          { value: "INVÁLIDA", label: "Inválida" },
                        ]}
                      />

                      <div className="flex items-end pt-5">
                        <Button
                          variant="secondary"
                          className="h-[40px] w-full"
                          onClick={() => {
                            setManagerDateFrom("");
                            setManagerDateTo("");
                            setManagerHourFrom("");
                            setManagerHourTo("");
                            setManagerUserFilter("");
                            setManagerTrustFilter("");
                          }}
                        >
                          Limpiar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {canReviewAdjustmentRequests && managerReviewTab === "requests" ? (
                  <div className="bg-white p-6" style={tabPanelAnimationStyle}>
                    <div className="mb-4 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Revisión
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">
                        Solicitudes pendientes
                      </h3>
                      <p className="text-sm text-slate-600">
                        Los usuarios autorizados pueden revisar y resolver estas solicitudes.
                      </p>
                    </div>
                    <div className="space-y-6">
                      <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-5">
                        <Input
                          label="Desde"
                          type="date"
                          value={requestsDateFrom}
                          onChange={(e) => setRequestsDateFrom(e.target.value)}
                        />
                        <Input
                          label="Hasta"
                          type="date"
                          value={requestsDateTo}
                          onChange={(e) => setRequestsDateTo(e.target.value)}
                        />
                        <Select
                          id="requestsStatusFilterManager"
                          label="Estado"
                          value={requestsStatusFilter}
                          onChange={(e) => setRequestsStatusFilter(e.target.value)}
                          options={[
                            { value: "", label: "Todos" },
                            { value: "PENDING_COORDINATOR", label: "Pendiente Coordinador" },
                            { value: "PENDING_ADMIN", label: "Pendiente Admin" },
                          ]}
                        />
                        <Select
                          id="requestsUserFilterManager"
                          label="Trabajador"
                          value={requestsUserFilter}
                          onChange={(e) => setRequestsUserFilter(e.target.value)}
                          options={[
                            { value: "", label: "Todos" },
                            ...teamMembers.map((member) => ({
                              value: member.id,
                              label: member.name,
                            })),
                          ]}
                        />
                        <div className="flex items-end">
                          <Button
                            variant="secondary"
                            className="w-full h-[40px]"
                            onClick={clearRequestFilters}
                          >
                            Limpiar
                          </Button>
                        </div>
                      </div>

                      {pendingRequestsLoading ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          Cargando solicitudes pendientes...
                        </p>
                      ) : filteredManagerRequests.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          No hay solicitudes pendientes que coincidan con los filtros.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="overflow-x-auto">

                            <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">

                              <thead>

                                <tr className="sticky top-0 z-10 bg-slate-50 text-left text-[11px] uppercase tracking-[0.14em] text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">

                                  <th className="w-[20%] py-3 pr-4 pl-4 font-semibold">Usuario</th>

                                  <th className="w-[11%] py-3 pr-4 font-semibold">Tipo</th>

                                  <th className="w-[12%] py-3 pr-4 font-semibold">Fecha y hora</th>

                                  <th className="w-[18%] py-3 pr-4 font-semibold">Motivo</th>

                                  <th className="w-[14%] py-3 pr-4 font-semibold">Estado</th>

                                  <th className="w-[17%] py-3 pr-4 font-semibold">Comentario</th>

                                  <th className="w-[8%] py-3 pr-4 font-semibold">Acciones</th>

                                </tr>

                              </thead>

                              <tbody className="divide-y divide-slate-100">

                                {filteredManagerRequests.map((request) => (

                                  <tr key={request.id} className="transition-colors hover:bg-slate-50/60">

                                    <td className="py-4 pr-4 pl-4 align-middle text-slate-700">
                                      <div className="flex items-center gap-3">
                                        <span className="font-semibold text-slate-900">
                                          {getDisplayUserName(
                                            request.userId,
                                            request.userName,
                                          )}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="py-4 pr-4 align-middle text-slate-700">

                                      <span

                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${ADJUSTMENT_TYPE_CLASSES[request.requestType]}`}

                                      >

                                        {ADJUSTMENT_TYPE_LABELS[request.requestType]}

                                      </span>

                                    </td>

                                    <td className="py-4 pr-4 align-middle font-medium leading-6 text-slate-600">

                                      {formatDateTime(request.requestedTime)}

                                    </td>

                                    <td className="py-4 pr-4 align-middle text-slate-700">

                                      <p className="max-w-[280px] whitespace-normal leading-6">

                                        {request.reason}

                                      </p>

                                    </td>

                                    <td className="py-4 pr-4 align-middle">

                                      <span

                                        className={`inline-flex min-h-[32px] items-center rounded-full px-3 py-1 text-[11px] font-semibold leading-4 ${request.status === "PENDING_COORDINATOR"

                                          ? "bg-amber-100 text-amber-700"

                                          : "bg-blue-100 text-blue-700"

                                          }`}

                                      >

                                        {ADJUSTMENT_STATUS_LABELS[request.status]}

                                      </span>

                                    </td>

                                    <td className="py-4 pr-4 align-middle">

                                      <textarea

                                        className="h-[72px] w-full min-w-[220px] resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-50"

                                        placeholder="Añade un comentario..."

                                        value={reviewComments[request.id] ?? ""}

                                        onChange={(event) =>

                                          setReviewComments((current) => ({

                                            ...current,

                                            [request.id]: event.target.value,

                                          }))

                                        }

                                      />

                                    </td>

                                    <td className="py-4 pr-4 align-middle text-right">

                                      <div className="flex justify-end gap-2">

                                        {(request.status === "PENDING_COORDINATOR" ||

                                          request.status === "PENDING_ADMIN") && (

                                            <>

                                              <Button

                                                variant="secondary"

                                                className="rounded-xl border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"

                                                onClick={() => reviewRequest(request.id, "REJECTED")}

                                                disabled={reviewSubmittingId === request.id || !isFunctionalAdmin}

                                              >

                                                Rechazar

                                              </Button>

                                              <Button

                                                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700"

                                                onClick={() => reviewRequest(request.id, "APPROVED")}

                                                disabled={reviewSubmittingId === request.id || !isFunctionalAdmin}

                                              >

                                                Aprobar

                                              </Button>

                                            </>

                                          )}

                                      </div>

                                    </td>

                                  </tr>

                                ))}

                              </tbody>

                            </table>

                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {managerReviewTab === "incidents" ? (
                  <div className="bg-white p-6" style={tabPanelAnimationStyle}>
                    <div className="mb-6 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Revisión
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">
                        Control de Incidencias y Anomalías
                      </h3>
                      <p className="text-sm text-slate-600">
                        Gestiona tanto las justificaciones enviadas por el equipo como los fichajes con errores detectados automáticamente.
                      </p>
                    </div>

                    <div className="space-y-8">
                      {/* Filtros de búsqueda */}
                      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
                        <Select
                          id="incidentsStatusFilterManager"
                          label="Estado Justificación"
                          value={incidentStatusFilter}
                          onChange={(e) => setIncidentStatusFilter(e.target.value)}
                          options={[
                            { value: "", label: "Todos los estados" },
                            { value: "PENDING_COORDINATOR", label: "Pendiente Administración (legado)" },
                            { value: "PENDING_ADMIN", label: "Pendiente Administración" },
                            { value: "APPROVED", label: "Aprobada" },
                            { value: "REJECTED", label: "Rechazada" },
                          ]}
                        />
                        <Select
                          id="incidentsUserFilterManager"
                          label="Trabajador"
                          value={incidentUserFilter}
                          onChange={(e) => setIncidentUserFilter(e.target.value)}
                          options={[
                            { value: "", label: "Todos los trabajadores" },
                            ...teamMembers.map((member) => ({
                              value: member.id,
                              label: member.name,
                            })),
                          ]}
                        />
                        <div className="flex items-end">
                          <Button
                            variant="secondary"
                            className="h-[40px] w-full"
                            onClick={clearIncidentFilters}
                          >
                            Limpiar Filtros
                          </Button>
                        </div>
                      </div>

                      {/* Sección 1: Justificaciones Pendientes */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            Justificaciones por revisar ({filteredManagerIncidents.length})
                          </h4>
                        </div>

                        {pendingIncidentJustificationsLoading ? (
                          <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                            <p className="mt-2 text-xs text-slate-500">Cargando solicitudes...</p>
                          </div>
                        ) : filteredManagerIncidents.length === 0 ? (
                          <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                            <p className="text-sm text-slate-500">No hay justificaciones con los filtros actuales.</p>
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  <tr>
                                    <th className="px-4 py-3">Trabajador</th>
                                    <th className="px-4 py-3">Registro</th>
                                    <th className="px-4 py-3">Motivo</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {filteredManagerIncidents.map((justification) => (
                                    <tr key={justification.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-4">
                                        <p className="font-semibold text-slate-900">
                                          {getDisplayUserName(justification.userId, justification.userName)}
                                        </p>
                                      </td>
                                      <td className="px-4 py-4">
                                        <div className="space-y-1">
                                          <p className="font-medium text-slate-900">
                                            {justification.workDate ? formatShortDate(justification.workDate) : "Sin fecha"}
                                          </p>
                                          <p className="text-xs text-slate-600">
                                            {getRecordLine({
                                              checkInAt: justification.checkInAt ?? "",
                                              checkOutAt: justification.checkOutAt ?? null,
                                            })}
                                          </p>
                                        </div>
                                      </td>
                                      <td className="px-4 py-4">
                                        <p className="max-w-[250px] whitespace-normal leading-5 text-slate-700">
                                          {justification.reason}
                                        </p>
                                      </td>
                                      <td className="px-4 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${INCIDENT_JUSTIFICATION_STATUS_CLASSES[justification.status]}`}>
                                          {INCIDENT_JUSTIFICATION_STATUS_LABELS[justification.status]}
                                        </span>
                                      </td>
                                      <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                          {(
                                            justification.status === "PENDING_COORDINATOR" ||
                                            justification.status === "PENDING_ADMIN"
                                          ) ? (
                                            <>
                                              <button
                                                onClick={() => reviewIncidentJustification(justification.id, "REJECTED")}
                                                disabled={reviewSubmittingId === justification.id || !isFunctionalAdmin}
                                                className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                                              >
                                                Rechazar
                                              </button>
                                              <button
                                                onClick={() => reviewIncidentJustification(justification.id, "APPROVED")}
                                                disabled={reviewSubmittingId === justification.id || !isFunctionalAdmin}
                                                className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                                              >
                                                Aprobar
                                              </button>
                                            </>
                                          ) : null}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sección 2: Anomalías Detectadas (Sin justificar necesariamente) */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            Fichajes con incidencia ({filteredManagerIncidentRecords.length})
                          </h4>
                        </div>

                        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-6">
                          <Select
                            id="incidentRecordUserFilter"
                            label="Trabajador"
                            value={incidentRecordUserFilter}
                            onChange={(e) => setIncidentRecordUserFilter(e.target.value)}
                            options={[
                              { value: "", label: "Todos" },
                              ...teamMembers.map((member) => ({
                                value: member.id,
                                label: member.name,
                              })),
                            ]}
                          />
                          <Input
                            label="Desde"
                            type="date"
                            value={incidentRecordDateFrom}
                            onChange={(event) => setIncidentRecordDateFrom(event.target.value)}
                          />
                          <Input
                            label="Hasta"
                            type="date"
                            value={incidentRecordDateTo}
                            onChange={(event) => setIncidentRecordDateTo(event.target.value)}
                          />
                          <Select
                            id="incidentRecordTrustFilter"
                            label="Validación"
                            value={incidentRecordTrustFilter}
                            onChange={(event) =>
                              setIncidentRecordTrustFilter(
                                event.target.value as "" | WorkdayTrustLevel,
                              )
                            }
                            options={[
                              { value: "", label: "Todas" },
                              { value: "ALTA", label: "Correcta" },
                              { value: "MEDIA", label: "Revisar" },
                              { value: "BAJA", label: "Incidencia" },
                              { value: "INVÁLIDA", label: "Inválida" },
                            ]}
                          />
                          <Select
                            id="incidentRecordStatusFilter"
                            label="Estado"
                            value={incidentRecordStatusFilter}
                            onChange={(e) =>
                              setIncidentRecordStatusFilter(e.target.value as "" | WorkdayStatus)
                            }
                            options={[
                              { value: "", label: "Todos" },
                              { value: "INCIDENT", label: "Incidencia" },
                              { value: "INCOMPLETE", label: "Incompleta" },
                            ]}
                          />
                          <div className="flex items-end">
                            <Button
                              variant="secondary"
                              className="h-[40px] w-full"
                              onClick={clearIncidentRecordFilters}
                            >
                              Limpiar
                            </Button>
                          </div>
                        </div>

                        {filteredManagerIncidentRecords.length === 0 ? (
                          <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                            <p className="text-sm text-slate-500">No hay fichajes con incidencia que coincidan con los filtros.</p>
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="hidden grid-cols-[minmax(0,1.5fr)_110px_120px_120px_minmax(0,2fr)_120px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:grid">
                              <span>Trabajador</span>
                              <span>Fecha</span>
                              <span>Estado</span>
                              <span>Validación</span>
                              <span>Detalle</span>
                              <span className="text-right">Acceso</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {filteredManagerIncidentRecords.map((record) => (
                                <button
                                  key={`anomaly-tab-${record.id}`}
                                  type="button"
                                  onClick={() => openManagerRecordDetail(record)}
                                  className="grid w-full gap-2 px-4 py-3 text-left transition hover:bg-orange-50/40 md:grid-cols-[minmax(0,1.5fr)_110px_120px_120px_minmax(0,2fr)_120px] md:items-center md:gap-3"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {getDisplayUserName(record.userId, record.userName)}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500 md:hidden">
                                      {formatShortDate(record.workDate)}
                                    </p>
                                  </div>
                                  <span className="hidden text-sm text-slate-600 md:block">
                                    {formatShortDate(record.workDate)}
                                  </span>
                                  <div>
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[record.status]}`}>
                                      {STATUS_LABELS[record.status]}
                                    </span>
                                  </div>
                                  <div>
                                    <span
                                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TRUST_LEVEL_CLASSES[getDisplayTrustLevel(record)]}`}
                                    >
                                      {getDisplayTrustLabel(record)}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm text-slate-700 md:hidden">
                                      {getRecordLine(record)}
                                    </p>
                                    <p className="truncate text-sm text-slate-700">
                                      {getStatusDetail(record)}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between md:justify-end">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                                      Abrir detalle
                                    </span>
                                    <span className="text-sm text-slate-300 md:ml-2">→</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {managerReviewTab === "exclusions" ? (
                  <div className="bg-white p-6" style={tabPanelAnimationStyle}>
                    <div className="mb-4 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Revisión
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">
                        Solicitudes de teletrabajo y permisos
                      </h3>
                      <p className="text-sm text-slate-600">
                        Flujo por etapas: trabajador, coordinador y administración.
                      </p>
                    </div>
                    <div className="space-y-6">
                      <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-5">
                        <Input
                          label="Desde"
                          type="date"
                          value={requestsDateFrom}
                          onChange={(e) => setRequestsDateFrom(e.target.value)}
                        />
                        <Input
                          label="Hasta"
                          type="date"
                          value={requestsDateTo}
                          onChange={(e) => setRequestsDateTo(e.target.value)}
                        />
                        <Select
                          id="exclStatusFilterManager"
                          label="Estado"
                          value={requestsStatusFilter}
                          onChange={(e) => setRequestsStatusFilter(e.target.value)}
                          options={[
                            { value: "", label: "Todos" },
                            { value: "PENDING_COORDINATOR", label: "Pendiente Coordinador" },
                            { value: "PENDING_ADMIN", label: "Pendiente Admin" },
                          ]}
                        />
                        <Select
                          id="exclUserFilterManager"
                          label="Trabajador"
                          value={requestsUserFilter}
                          onChange={(e) => setRequestsUserFilter(e.target.value)}
                          options={[
                            { value: "", label: "Todos" },
                            ...teamMembers.map((member) => ({
                              value: member.id,
                              label: member.name,
                            })),
                          ]}
                        />
                        <div className="flex items-end">
                          <Button
                            variant="secondary"
                            className="w-full h-[40px]"
                            onClick={clearRequestFilters}
                          >
                            Limpiar
                          </Button>
                        </div>
                      </div>

                      {pendingExclusionRequestsLoading ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          Cargando solicitudes...
                        </p>
                      ) : filteredManagerExclusions.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          No hay solicitudes que coincidan con los filtros.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead>
                              <tr className="sticky top-0 z-10 bg-slate-50 text-left text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                                <th className="py-2.5 pr-4 pl-3 font-semibold">Usuario</th>
                                <th className="py-2.5 pr-4 font-semibold">Tipo</th>
                                <th className="py-2.5 pr-4 font-semibold">Fecha</th>
                                <th className="py-2.5 pr-4 font-semibold">Estado</th>
                                <th className="py-2.5 pr-4 font-semibold">Motivo</th>
                                <th className="py-2.5 pr-4 font-semibold">Comentario</th>
                                <th className="py-2.5 pr-4 font-semibold">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredManagerExclusions.map((request) => (
                                <tr key={`pending-exclusion-${request.kind}-${request.id}`} className="align-top">
                                  <td className="py-3 pr-4 text-slate-700">
                                    {getDisplayUserName(
                                      request.userId,
                                      request.userName,
                                    )}
                                  </td>
                                  <td className="py-3 pr-4">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${request.kind === "REMOTE_WORK"
                                        ? "bg-indigo-100 text-indigo-800"
                                        : "bg-cyan-100 text-cyan-800"
                                        }`}
                                    >
                                      {request.kind === "REMOTE_WORK" ? "Teletrabajo" : "Permiso"}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-4 text-slate-700">
                                    {formatShortDate(request.requestDate)}
                                  </td>
                                  <td className="py-3 pr-4">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${EXCLUSION_REQUEST_STATUS_CLASSES[request.status]}`}
                                    >
                                      {EXCLUSION_REQUEST_STATUS_LABELS[request.status]}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-4 text-slate-700">
                                    <p className="max-w-[280px] whitespace-normal leading-6">
                                      {request.reason}
                                    </p>
                                  </td>
                                  <td className="py-3 pr-4">
                                    <textarea
                                      className="h-[72px] w-full min-w-[220px] resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                                      placeholder="Añade un comentario..."
                                      value={reviewComments[request.id] ?? ""}
                                      onChange={(event) =>
                                        setReviewComments((current) => ({
                                          ...current,
                                          [request.id]: event.target.value,
                                        }))
                                      }
                                    />
                                  </td>
                                  <td className="py-3 pr-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="secondary"
                                        className="border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
                                        onClick={() => reviewExclusionRequest(request, "REJECTED")}
                                        disabled={
                                          reviewSubmittingId === request.id ||
                                          (request.status === "PENDING_ADMIN" && !isFunctionalAdmin)
                                        }
                                      >
                                        Rechazar
                                      </Button>
                                      <Button
                                        className={`${request.status === "PENDING_ADMIN" ? "bg-blue-600 hover:bg-blue-700" : ""} px-3 py-1.5 text-xs`}
                                        onClick={() => reviewExclusionRequest(request, "APPROVED")}
                                        disabled={
                                          reviewSubmittingId === request.id ||
                                          (request.status === "PENDING_ADMIN" && !isFunctionalAdmin)
                                        }
                                      >
                                        Aprobar
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
                  </div>
                ) : null}
                {canViewTeamRecords && managerReviewTab === "records" ? (
                  <div
                    ref={recordsSectionRef}
                    className="bg-white p-6"
                    style={tabPanelAnimationStyle}
                  >
                    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Completada
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Incidencia
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Abierta
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        Incompleta
                      </span>
                    </div>

                    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Validación del fichaje
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800">
                          Correcta
                        </span>
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-sky-100 text-sky-800">
                          Revisar
                        </span>
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800">
                          Incidencia
                        </span>
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-rose-100 text-rose-800">
                          Inválida
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                        <p>
                          <span className="font-medium text-slate-900">Correcta:</span>{" "}
                          ubicación válida, dispositivo esperado y red confiable.
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Revisar:</span>{" "}
                          ubicación válida y dispositivo esperado, pero con menos contexto de red.
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Incidencia:</span>{" "}
                          fichaje permitido, pero con anomalía de dispositivo o ubicación.
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Inválida:</span>{" "}
                          datos insuficientes o coordenadas no válidas.
                        </p>
                      </div>
                      <div className="mt-2 text-[11px] italic text-slate-500 border-t border-slate-100 pt-2">
                        💡 Consejo: Pasa el cursor sobre las etiquetas de la columna "Validación" para ver los detalles técnicos (dispositivo, red e IP).
                      </div>
                    </div>

                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Equipo
                        </p>
                        <h3 className="text-base font-semibold text-slate-900">
                          Registros del equipo
                        </h3>
                        <p className="text-sm text-slate-600">
                          Consulta todos los fichajes registrados en el conjunto filtrado actual.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="flex items-center gap-2"
                          onClick={exportToExcel}
                          disabled={managerVisibleRecords.length === 0 || !managerUserFilter}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Descargar Excel
                        </Button>
                      </div>
                    </div>
                    {!managerUserFilter ? (
                      <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs font-medium text-amber-700">
                          Selecciona un trabajador en el filtro para exportar su informe.
                        </p>
                      </div>
                    ) : null}

                    {loading ? (
                      <p className="text-sm text-slate-500">
                        Cargando registros del equipo...
                      </p>
                    ) : managerVisibleRecords.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No hay registros que coincidan con los filtros aplicados.
                      </p>
                    ) : (
                      <div className="max-h-[600px] overflow-auto rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead>
                            <tr className="sticky top-0 z-10 bg-slate-50 text-left text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                              <th className="py-2.5 pr-4 pl-5 font-semibold">Trabajador</th>
                              <th className="py-2.5 pr-4 font-semibold">Fecha</th>
                              <th className="py-2.5 pr-4 font-semibold">Entrada</th>
                              <th className="py-2.5 pr-4 font-semibold">Salida</th>
                              <th className="py-2.5 pr-4 font-semibold">Horas</th>
                              <th className="py-2.5 pr-4 font-semibold">Estado</th>
                              <th className="py-2.5 pr-4 font-semibold">Validación</th>
                              <th className="py-2.5 pr-4 font-semibold">Detalle</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {managerVisibleRecords.map((record) => (
                              <tr key={`manager-record-${record.id}`}>
                                <td className="py-3 pr-4 pl-5 text-slate-700">
                                  {getDisplayUserName(
                                    record.userId,
                                    record.userName,
                                  )}
                                </td>
                                <td className="py-3 pr-4 text-slate-700">
                                  {formatShortDate(record.workDate)}
                                </td>
                                <td className="py-3 pr-4 text-slate-700">
                                  {formatTimeOnly(record.checkInAt)}
                                </td>
                                <td className="py-3 pr-4 text-slate-700">
                                  {formatTimeOnly(record.checkOutAt)}
                                </td>
                                <td className="py-3 pr-4 text-slate-700">
                                  {formatHoursFromMinutes(record.workedMinutes)}
                                </td>
                                <td className="py-3 pr-4">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[record.status]}`}
                                  >
                                    {STATUS_LABELS[record.status]}
                                  </span>
                                </td>
                                <td className="py-3 pr-4" title={getRecordContextLine(record)}>
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TRUST_LEVEL_CLASSES[getDisplayTrustLevel(record)]}`}
                                  >
                                    {getDisplayTrustLabel(record)}
                                  </span>
                                </td>
                                <td className="py-3 pr-4 text-slate-700">
                                  {getStatusDetail(record)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
        {showWorkerOverview && (
          <aside className="hidden xl:block w-[180px] shrink-0 sticky top-[100px]">
            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Acciones rápidas
                </p>
                <p className="text-[10px] leading-tight text-slate-500">
                  Gestión y consultas rápidas.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  {isWorkerMode && (
                    <>
                      {!openRecord ? (
                        <Button
                          className="w-full bg-emerald-600 px-1 py-2 text-[10px] hover:bg-emerald-700"
                          onClick={() =>
                            submitAction(
                              "/api/time-control/check-in",
                              "Entrada registrada correctamente.",
                            )
                          }
                          disabled={submitting}
                        >
                          Fichar entrada
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-rose-600 px-1 py-2 text-[10px] hover:bg-rose-700"
                          onClick={() =>
                            submitAction(
                              "/api/time-control/check-out",
                              "Salida registrada correctamente.",
                            )
                          }
                          disabled={submitting}
                        >
                          Fichar salida
                        </Button>
                      )}
                    </>
                  )}

                  <Button
                    variant="secondary"
                    className="w-full px-1 py-2 text-[10px]"
                    onClick={() => setShowRequestModal(true)}
                  >
                    Solicitar fichaje
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full px-1 py-2 text-[10px]"
                    onClick={openWorkerRequestsPage}
                  >
                    Mis solicitudes
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="secondary"
                    disabled={submitting}
                    className="w-full py-2 text-[10px]"
                    onClick={() => setShowLocationHelp((current) => !current)}
                  >
                    {showLocationHelp ? "Ocultar ayuda" : "Ayuda ubicación"}
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </section>
      {actionPopup ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <svg
                  className="h-7 w-7 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Procesando acción
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {actionPopup.message}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${toast.tone === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
                  }`}
              >
                {toast.tone === "success" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-7 w-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-7 w-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.67 18h16.66a1 1 0 00.88-1.14l-7.5-13a1 1 0 00-1.74 0z"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {toast.tone === "success" ? "Operación completada" : "Se produjo un error"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{toast.message}</p>
              <div className="mt-5">
                <Button onClick={() => setToast(null)}>
                  Aceptar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {selectedOverflowDate && selectedOverflowRecords.length > 0 ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  Jornadas del {formatDateTime(`${selectedOverflowDate} 00:00:00`).slice(0, 10)}
                </h3>
                <p className="text-sm text-slate-600">
                  Aquí puedes ver todos los fichajes registrados en ese día.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setSelectedOverflowDate(null)}
              >
                Cerrar
              </Button>
            </div>

            <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {selectedOverflowRecords.map((record) => (
                <div
                  key={`overflow-${record.id}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-slate-900">
                      {getRecordLine(record)}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CALENDAR_STATUS_BADGE_CLASSES[record.status]}`}
                    >
                      {STATUS_LABELS[record.status]}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-medium text-slate-900">Entrada:</span>{" "}
                      {formatDateTime(record.checkInAt)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Salida:</span>{" "}
                      {formatDateTime(record.checkOutAt)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Horas:</span>{" "}
                      {formatHoursFromMinutes(record.workedMinutes)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Detalle:</span>{" "}
                      {getStatusDetail(record)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {managerDailyListType ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800">
                  {managerDailyListType === "checked-in"
                    ? "Fichados en fecha seleccionada"
                    : managerDailyListType === "missing"
                      ? "No fichados en fecha seleccionada"
                      : "Excluidos (Vacaciones/Permisos)"}
                </p>
                <p className="text-xs text-slate-500">
                  {formatShortDate(trackerDate)}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setManagerDailyListType(null)}
              >
                Cerrar
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
              {managerDailyListUsers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay usuarios en esta lista para la fecha seleccionada.
                </p>
              ) : (
                <ul className="space-y-2">
                  {managerDailyListUsers.map((user) => (
                    <li
                      key={`manager-daily-${managerDailyListType}-${user.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      {user.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {showRemoteWorkModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800">
                  Teletrabajo autorizado en fecha seleccionada
                </p>
                <p className="text-xs text-slate-500">
                  {remoteWorkTodayUsers.length} autorizado
                  {remoteWorkTodayUsers.length === 1 ? "" : "s"} para fichar
                  desde internet
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowRemoteWorkModal(false)}
              >
                Cerrar
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
              {remoteWorkTodayUsers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay usuarios autorizados en teletrabajo para la fecha seleccionada.
                </p>
              ) : (
                <ul className="space-y-2">
                  {remoteWorkTodayUsers.map((user) => {
                    const hasCheckedIn = checkedInTrackerUserIds.has(user.id);

                    return (
                      <li
                        key={`remote-work-${user.id}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-slate-700">{user.name}</p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${hasCheckedIn
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                              }`}
                          >
                            {hasCheckedIn ? "Ha fichado" : "Pendiente de fichar"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {showManagerIncidentsModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800">
                  Incidencias en el rango actual
                </p>
                <p className="text-xs text-slate-500">
                  {managerIncidentRecords.length} registro
                  {managerIncidentRecords.length === 1 ? "" : "s"} con incidencia
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowManagerIncidentsModal(false)}
              >
                Cerrar
              </Button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-4 py-4">
              {managerIncidentRecords.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay incidencias en el conjunto filtrado actualmente.
                </p>
              ) : (
                <div className="space-y-3">
                  {managerIncidentRecords.map((record) => (
                    <div
                      key={`manager-incident-${record.id}`}
                      // CAMBIO: Pasamos de rose-50 a amber-50 y de rose-200 a amber-200
                      className="rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-slate-900">
                          {getDisplayUserName(
                            record.userId,
                            record.userName,
                          )}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-700">
                          {formatShortDate(record.workDate)}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[record.status]
                            }`}
                        >
                          {STATUS_LABELS[record.status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">
                        {getRecordLine(record)}
                      </p>
                      {/* CAMBIO: Pasamos de text-rose-700 a text-amber-700 */}
                      <p className="mt-1 text-sm font-medium text-amber-800">
                        {getStatusDetail(record)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {selectedDetailDate && selectedDetailRecords.length > 0 ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-medium text-slate-800">
                Detalle de {selectedDetailUserId ? getDisplayUserName(selectedDetailUserId, selectedDetailRecords[0]?.userName) : ""} el {formatDateTime(`${selectedDetailDate} 00:00:00`).slice(0, 10)}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedDetailDate(null);
                  setSelectedDetailUserId(null);
                }}
              >
                Cerrar
              </Button>
            </div>

            <div className="max-h-[65vh] space-y-3 overflow-y-auto px-4 py-4">
              {selectedDetailRecords.map((record) => (
                <div
                  key={`detail-${record.id}`}
                  className={`rounded-xl border p-3 ${record.status === "INCIDENT"
                    ? "border-rose-300 bg-rose-50"
                    : record.status === "COMPLETED"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-stone-50"
                    }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-base font-medium text-slate-800">
                      {getRecordLine(record)}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CALENDAR_STATUS_BADGE_CLASSES[record.status]}`}
                    >
                      {STATUS_LABELS[record.status]}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${getRecordBarClass(record.status)}`}
                        style={{ width: getRecordBarWidth(record) }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Trabajado: {formatHoursFromMinutes(record.workedMinutes)}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {getStatusDetail(record)}
                  </p>
                </div>
              ))}

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Total trabajado del día
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatHoursFromMinutes(selectedDetailWorkedMinutes)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isWorkerMode && selectedIncidentRecordId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  Justificar incidencia
                </h3>
                <p className="text-sm text-slate-600">
                  Explica el motivo para que coordinación y administración
                  puedan revisarlo.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedIncidentRecordId(null);
                  setIncidentJustificationReason("");
                }}
              >
                Cerrar
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-slate-700"
                  htmlFor="incidentJustificationReason"
                >
                  Motivo *
                </label>
                <textarea
                  id="incidentJustificationReason"
                  className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  required
                  value={incidentJustificationReason}
                  onChange={(event) =>
                    setIncidentJustificationReason(event.target.value)
                  }
                />
                <p className="text-xs text-slate-500">
                  Describe qué ocurrió y cualquier contexto útil para la
                  revisión.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedIncidentRecordId(null);
                    setIncidentJustificationReason("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={incidentJustificationSubmitting}
                  onClick={submitIncidentJustification}
                >
                  {incidentJustificationSubmitting
                    ? "Enviando..."
                    : "Enviar justificación"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isWorkerMode && incidentJustificationToDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">

            {/* CABECERA CON BOTÓN DE CERRAR (X) */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  Eliminar justificación
                </h3>
                <p className="text-sm text-slate-600">
                  Esta acción eliminará la justificación aprobada de esta
                  incidencia.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Incidencia:</span>{" "}
                  {incidentJustificationToDelete.workDate
                    ? formatShortDate(incidentJustificationToDelete.workDate)
                    : "Sin fecha"}{" "}
                  ·{" "}
                  {getRecordLine({
                    checkInAt: incidentJustificationToDelete.checkInAt ?? "",
                    checkOutAt: incidentJustificationToDelete.checkOutAt ?? null,
                  })}
                </p>

                <p className="mt-2">
                  <span className="font-medium text-slate-900">Motivo:</span>{" "}
                  {incidentJustificationToDelete.reason}
                </p>
              </div>

              <p className="text-sm text-slate-700">
                ¿Seguro que quieres eliminar esta justificación?
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIncidentJustificationToDelete(null)}
                  disabled={Boolean(deletingIncidentJustificationId)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={deleteIncidentJustification}
                  disabled={Boolean(deletingIncidentJustificationId)}
                >
                  {deletingIncidentJustificationId
                    ? "Eliminando..."
                    : "Eliminar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {isWorkerMode && showRequestModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">
                  Solicitar fichaje anterior
                </h3>
                <p className="text-sm text-slate-600">
                  Pide una entrada o salida de una fecha anterior.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowRequestModal(false)}
              >
                Cerrar
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                <Select
                  id="requestType"
                  label="Tipo de solicitud"
                  className="h-[42px] rounded-lg"
                  value={requestType}
                  onChange={(event) =>
                    setRequestType(event.target.value as AdjustmentRequestType)
                  }
                  options={[
                    { value: "CHECK_IN", label: "Entrada" },
                    { value: "CHECK_OUT", label: "Salida" },
                  ]}
                />

                <Input
                  label="Fecha y hora solicitadas"
                  type="datetime-local"
                  className="h-[42px] rounded-lg"
                  value={requestedTime}
                  onChange={(event) => setRequestedTime(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-slate-700"
                  htmlFor="requestReason"
                >
                  Motivo *
                </label>
                <textarea
                  id="requestReason"
                  className="min-h-[88px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  required
                  value={requestReason}
                  onChange={(event) => setRequestReason(event.target.value)}
                />
                <p className="text-xs text-slate-500">
                  El motivo es obligatorio para poder enviar la solicitud.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={requestSubmitting}
                  onClick={submitAdjustmentRequest}
                >
                  Enviar solicitud
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {/* Modal de Detalle de Fichaje (Cuadrante) */}
      <Modal
        open={!!selectedRecordForDetail}
        onClose={() => setSelectedRecordForDetail(null)}
        title="Detalle del Fichaje"
      >
        {selectedRecordForDetail && (
          <div className="space-y-4">
            {/* Cabecera estilo captura */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-800">
                Detalle de el {new Date(selectedRecordForDetail.workDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>

            {/* Tarjeta Principal Verde */}
            <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50/40 p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-4">
                <span className="text-2xl font-black tracking-tight text-slate-800">
                  {formatDateTime(selectedRecordForDetail.checkInAt).split(" ")[1]} - {selectedRecordForDetail.checkOutAt ? formatDateTime(selectedRecordForDetail.checkOutAt).split(" ")[1] : "En curso"}
                </span>
                <span className={`rounded-full px-4 py-1 text-[11px] font-bold ${STATUS_CLASSES[selectedRecordForDetail.status]}`}>
                  {STATUS_LABELS[selectedRecordForDetail.status]}
                </span>
              </div>

              {/* Barra de Progreso */}
              <div className="relative mb-6 h-3 w-full rounded-full bg-slate-200/50">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${Math.min(((selectedRecordForDetail.workedMinutes || 0) / 480) * 100, 100)}%` }}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500">
                  Trabajado: {formatHoursFromMinutes(selectedRecordForDetail.workedMinutes)}
                </p>
                <p className="text-lg font-semibold text-slate-700">
                  {selectedRecordForDetail.incidentFlags && selectedRecordForDetail.incidentFlags.length > 0
                    ? "Se han detectado incidencias en este fichaje."
                    : "Fichaje completado sin problemas."}
                </p>
              </div>
            </div>

            {/* Tarjeta de Total */}
            <div className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8">
              <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                Total trabajado del día
              </p>
              <p className="text-4xl font-black tracking-tighter text-slate-900">
                {formatHoursFromMinutes(selectedRecordForDetail.workedMinutes)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
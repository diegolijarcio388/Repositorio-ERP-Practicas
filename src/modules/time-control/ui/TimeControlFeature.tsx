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
} from "../domain/types";

interface TimeControlFeatureProps {
  session: UserSession;
  mode: "worker" | "manager";
  workerView?: "overview" | "requests";
  headerSlot?: React.ReactNode;
}

type DisplayWorkdayStatus = "COMPLETED" | "OPEN" | "ABSENT" | "INCIDENT";
type DisplayWorkdayTrustLevel = "CORRECT" | "REVIEW";

const STATUS_LABELS: Record<DisplayWorkdayStatus, string> = {
  OPEN: "Abierta",
  COMPLETED: "Cerrado",
  ABSENT: "Ausente",
  INCIDENT: "Cerrado",
};


const STATUS_CLASSES: Record<DisplayWorkdayStatus, string> = {
  OPEN: "border border-amber-500 bg-transparent text-amber-700",
  COMPLETED: "border border-emerald-500 bg-transparent text-emerald-700",
  ABSENT: "border border-slate-400 bg-transparent text-slate-600",
  INCIDENT: "border border-rose-500 bg-transparent text-rose-700",
};

const CALENDAR_STATUS_BADGE_CLASSES: Record<DisplayWorkdayStatus, string> = {
  OPEN: "border border-amber-500 bg-transparent text-amber-700",
  COMPLETED: "border border-emerald-500 bg-transparent text-emerald-700",
  ABSENT: "border border-slate-400 bg-transparent text-slate-600",
  INCIDENT: "border border-rose-500 bg-transparent text-rose-700",
};

const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentRequestStatus, string> = {
  PENDING_COORDINATOR: "Pendiente administración",
  PENDING_ADMIN: "Pendiente administración",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const ADJUSTMENT_STATUS_CLASSES: Record<AdjustmentRequestStatus, string> = {
  PENDING_COORDINATOR: "border border-amber-500 bg-transparent text-amber-700",
  PENDING_ADMIN: "border border-orange-500 bg-transparent text-orange-700",
  APPROVED: "border border-emerald-500 bg-transparent text-emerald-700",
  REJECTED: "border border-rose-500 bg-transparent text-rose-700",
};

const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentRequestType, string> = {
  CHECK_IN: "Entrada",
  CHECK_OUT: "Salida",
};

const ADJUSTMENT_TYPE_CLASSES: Record<AdjustmentRequestType, string> = {
  CHECK_IN: "border border-sky-500 bg-transparent text-sky-700",
  CHECK_OUT: "border border-violet-500 bg-transparent text-violet-700",
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
  PENDING_COORDINATOR: "border border-amber-500 bg-transparent text-amber-700",
  PENDING_ADMIN: "border border-orange-500 bg-transparent text-orange-700",
  APPROVED: "border border-emerald-500 bg-transparent text-emerald-700",
  REJECTED: "border border-rose-500 bg-transparent text-rose-700",
};

const PENDING_ADMINISTRATION_FILTER_VALUE = "__PENDING_ADMINISTRATION__";

const matchesPendingAdministrationStatus = (
  status: WorkdayIncidentJustification["status"],
): boolean => status === "PENDING_ADMIN" || status === "PENDING_COORDINATOR";

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  const [datePart, timePart = ""] = value.split(" ");
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return value;
  const time = timePart.slice(0, 5);
  return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
};

const formatHoursFromMinutes = (value: number): string => {
  const safeMinutes = Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
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
const TRACKER_HOURS = Array.from({ length: 24 }, (_, index) => index);
const TRACKER_DEFAULT_SCROLL_HOUR = 6;

const getTodaySqlDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

const getRecordLine = (
  record: Pick<WorkdayRecord, "checkInAt" | "checkOutAt">,
): string => {
  const checkIn = formatTimeOnly(record.checkInAt);
  const checkOut = formatTimeOnly(record.checkOutAt);
  return `${checkIn}-${checkOut === "-" ? "??" : checkOut}`;
};

const formatCoordinate = (value: number | null | undefined): string => {
  if (!Number.isFinite(value)) return "-";
  return Number(value).toFixed(6);
};

const getAdminValidationReasonLabel = (
  record: WorkdayRecord,
): string | null => {
  switch (record.adminValidationReason) {
    case "OUTSIDE_ALLOWED_LOCATION":
      return "Fuera de sede";
    case "DEVICE_NOT_ALLOWED":
      return "Dispositivo no permitido";
    case "DESKTOP_DEVICE":
      return "Uso desde escritorio";
    case "UNKNOWN_DEVICE":
      return "Dispositivo no identificado";
    case "EXTERNAL_NETWORK":
      return "Red externa";
    default:
      return null;
  }
};

const isPendingAdminValidation = (record: WorkdayRecord): boolean =>
  record.requiresAdminValidation && record.adminValidationStatus === "PENDING";

const getDisplayStatus = (status: WorkdayStatus): DisplayWorkdayStatus => {
  if (status === "OPEN") return "OPEN";
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "INCIDENT") return "COMPLETED";
  return "ABSENT";
};

const getDisplayRecordStatus = (record: WorkdayRecord): DisplayWorkdayStatus =>
  getDisplayStatus(record.status);

const getTrustTooltip = (record: WorkdayRecord): string | undefined => {
  if (getDisplayTrustLevel(record) === "REVIEW") {
    return "Requiere revisión administrativa";
  }
  return undefined;
};

const getIncidentFlagMessage = (flag: IncidentFlag): string => {
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
  switch (getDisplayRecordStatus(record)) {
    case "COMPLETED":
      return "bg-emerald-500";
    case "INCIDENT":
      return "bg-rose-500";
    case "OPEN":
      return "bg-amber-500";
    case "ABSENT":
      return "bg-slate-400";
    default:
      return "bg-slate-300";
  }
};

const getCalendarRecordClasses = (
  record: WorkdayRecord,
  isWeekendCell: boolean,
): string => {
  if (isWeekendCell) {
    return "bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/50 shadow-sm";
  }

  switch (getDisplayRecordStatus(record)) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-200/50 shadow-sm";
    case "INCIDENT":
      return "bg-rose-50 text-rose-900 ring-1 ring-inset ring-rose-200/50 shadow-sm";
    case "OPEN":
      return "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200/50 shadow-sm";
    case "ABSENT":
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

  switch (getDisplayStatus(status)) {
    case "COMPLETED":
      return "text-emerald-700";
    case "INCIDENT":
      return "text-rose-700";
    case "OPEN":
      return "text-amber-700";
    case "ABSENT":
      return "text-slate-700";
    default:
      return "text-slate-700";
  }
};

const getRecordBarClass = (status: WorkdayStatus): string => {
  switch (getDisplayStatus(status)) {
    case "COMPLETED":
      return "bg-emerald-400";
    case "INCIDENT":
      return "bg-rose-400";
    case "OPEN":
      return "bg-amber-400";
    case "ABSENT":
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

const getPrimaryDayStatus = (
  records: WorkdayRecord[],
): WorkdayStatus | null => {
  if (records.some((record) => record.status === "INCIDENT")) return "INCIDENT";
  if (records.some((record) => record.status === "INCOMPLETE"))
    return "INCOMPLETE";
  if (records.some((record) => record.status === "OPEN")) return "OPEN";
  if (records.some((record) => record.status === "COMPLETED"))
    return "COMPLETED";
  return null;
};

const DETAIL_LINK_CLASSES: Record<DisplayWorkdayStatus, string> = {
  COMPLETED: "text-emerald-600",
  OPEN: "text-amber-600",
  ABSENT: "text-slate-500",
  INCIDENT: "text-rose-600",
};

const TRUST_LEVEL_CLASSES: Record<DisplayWorkdayTrustLevel, string> = {
  CORRECT: "border border-emerald-500 bg-transparent text-emerald-700",
  REVIEW: "border border-sky-500 bg-transparent text-sky-700",
};

const TRUST_LEVEL_LABELS: Record<DisplayWorkdayTrustLevel, string> = {
  CORRECT: "Correcta",
  REVIEW: "Revisar",
};

const RECORD_STATE_LEGEND_ITEMS = [
  {
    label: "Cerrado",
    borderClass: "border-emerald-500",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  {
    label: "Abierta",
    borderClass: "border-amber-500",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
  },
  {
    label: "Ausente",
    borderClass: "border-slate-400",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
  },
] as const;

const RECORD_VALIDATION_LEGEND_ITEMS = [
  {
    label: "Correcta",
    borderClass: "border-emerald-500",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  {
    label: "Revisar",
    borderClass: "border-sky-500",
    dotClass: "bg-sky-500",
    textClass: "text-sky-700",
  },
] as const;

const renderLegendChip = (item: {
  label: string;
  borderClass: string;
  dotClass: string;
  textClass: string;
}) => (
  <span
    key={item.label}
    className="inline-flex items-center gap-1.5"
  >
    <span className={`h-0.5 w-3 rounded-full ${item.dotClass}`} />
    <span className={`text-[12px] font-medium ${item.textClass}`}>
      {item.label}
    </span>
  </span>
);

const POPUP_NEUTRAL_BUTTON_CLASS =
  "flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900";

const POPUP_PRIMARY_BUTTON_CLASS =
  "flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800";

const POPUP_DANGER_BUTTON_CLASS =
  "flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-rose-700";
const OPEN_WORKDAY_WARNING_MINUTES = 8 * 60 + 15;
const OPEN_WORKDAY_CRITICAL_MINUTES = 24 * 60;

const DEVICE_TYPE_LABELS: Record<WorkdayDeviceType, string> = {
  MOBILE: "MÓVIL",
  TABLET: "TABLET",
  DESKTOP: "ESCRITORIO",
  UNKNOWN: "DESCONOCIDO",
};

const getDeviceTypeLabel = (deviceType: WorkdayDeviceType | null): string =>
  deviceType ? DEVICE_TYPE_LABELS[deviceType] : "Dispositivo";

const getDisplayTrustLevel = (
  record: WorkdayRecord,
): DisplayWorkdayTrustLevel => {
  if (record.adminValidationStatus === "APPROVED") {
    return "CORRECT";
  }

  if (
    record.status === "INCIDENT" ||
    Boolean(record.incidentFlags?.length) ||
    isPendingAdminValidation(record)
  ) {
    return "REVIEW";
  }

  return (record.trustLevel ?? "MEDIA") === "ALTA" ? "CORRECT" : "REVIEW";
};

const hasAdminResponseForAdjustmentRequest = (
  request: WorkdayAdjustmentRequest,
): boolean =>
  ["APPROVED", "REJECTED"].includes(request.status) &&
  (Boolean(request.reviewedByAdminId) || Boolean(request.adminComment));

const hasAdminResponseForIncidentJustification = (
  justification: WorkdayIncidentJustification,
): boolean =>
  ["APPROVED", "REJECTED"].includes(justification.status) &&
  (Boolean(justification.reviewedByAdminId) ||
    Boolean(justification.adminComment));

const getRecordNetworkLabel = (record: WorkdayRecord): string => {
  if (!record.checkInIpAddress?.trim()) {
    return "Sin contexto de red";
  }

  return "Red registrada";
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
type ManagerReviewTab = "requests" | "incidents" | "exclusions" | "records" | "tracker";

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

const EXCLUSION_REQUEST_STATUS_LABELS: Record<ExclusionRequestStatus, string> =
  {
    PENDING_COORDINATOR: "Pendiente coordinador",
    PENDING_ADMIN: "Pendiente administración",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
  };

const EXCLUSION_REQUEST_STATUS_CLASSES: Record<ExclusionRequestStatus, string> =
  {
    PENDING_COORDINATOR:
      "border border-amber-500 bg-transparent text-amber-700",
    PENDING_ADMIN: "border border-orange-500 bg-transparent text-orange-700",
    APPROVED: "border border-emerald-500 bg-transparent text-emerald-700",
    REJECTED: "border border-rose-500 bg-transparent text-rose-700",
  };

const normalizeDateTimeLocalToSql = (value: string): string => {
  if (!value) return "";

  const normalized = value.replace("T", " ");
  return normalized.length === 16
    ? `${normalized}:00.000`
    : `${normalized}.000`;
};

const sqlDateTimeToDateTimeLocal = (value?: string | null): string => {
  if (!value) return "";
  return value.replace(" ", "T").slice(0, 16);
};

const getMinutesFromTimeValue = (value?: string | null): number | null => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const getMinutesFromSqlDateTime = (value?: string | null): number | null =>
  getMinutesFromTimeValue(getTimeOnlyFromSqlDateTime(value));

const getOpenWorkdayMinutes = (record: WorkdayRecord): number => {
  const startTime = new Date(record.checkInAt.replace(" ", "T")).getTime();
  if (!Number.isFinite(startTime)) return 0;
  return Math.max(0, Math.floor((Date.now() - startTime) / 60000));
};

const getStartOfWeekSqlDate = (sqlDate: string): string => {
  const date = new Date(`${sqlDate}T12:00:00`);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
};

const getEndOfWeekSqlDate = (sqlDate: string): string => {
  const start = new Date(`${getStartOfWeekSqlDate(sqlDate)}T12:00:00`);
  start.setDate(start.getDate() + 6);
  return start.toISOString().slice(0, 10);
};

const doesHourlySlotMatchRecord = (
  record: WorkdayRecord,
  hour: number,
): boolean => {
  const recordStartMinutes = getMinutesFromSqlDateTime(record.checkInAt);
  if (recordStartMinutes === null) {
    return false;
  }

  let recordEndMinutes = getMinutesFromSqlDateTime(record.checkOutAt);
  if (recordEndMinutes === null) {
    if (record.status === "OPEN" && record.workDate === getTodaySqlDate()) {
      const now = new Date();
      recordEndMinutes = now.getHours() * 60 + now.getMinutes();
    } else {
      recordEndMinutes = recordStartMinutes + 1;
    }
  }

  const slotStartMinutes = hour * 60;
  const slotEndMinutes = slotStartMinutes + 60;

  return (
    recordStartMinutes < slotEndMinutes && recordEndMinutes > slotStartMinutes
  );
};

const getHourlySlotRecordPriority = (record: WorkdayRecord): number => {
  if (record.status === "INCIDENT") return 500;
  if (record.status === "INCOMPLETE") return 400;
  if (record.status === "OPEN") return 300;
  if (
    record.requiresAdminValidation &&
    record.adminValidationStatus === "PENDING"
  ) {
    return 200;
  }
  if (record.status === "COMPLETED") return 100;
  return 0;
};

const getHourlySlotRecord = (
  records: WorkdayRecord[],
  hour: number,
): WorkdayRecord | undefined =>
  records
    .filter((record) => doesHourlySlotMatchRecord(record, hour))
    .sort(
      (left, right) =>
        getHourlySlotRecordPriority(right) - getHourlySlotRecordPriority(left),
    )[0];

/**
 * Calcula el offset proporcional (0–1) del inicio y fin de un record
 * dentro de una celda horaria concreta, para renderizar slots parciales.
 */
const getSlotProportionalOffset = (
  record: WorkdayRecord,
  hour: number,
): { leftFraction: number; rightFraction: number } => {
  const startMinutes = getMinutesFromSqlDateTime(record.checkInAt) ?? hour * 60;
  let endMinutes = getMinutesFromSqlDateTime(record.checkOutAt);
  if (endMinutes === null) {
    if (record.status === "OPEN" && record.workDate === getTodaySqlDate()) {
      const now = new Date();
      endMinutes = now.getHours() * 60 + now.getMinutes();
    } else {
      endMinutes = startMinutes + 1;
    }
  }
  const slotStart = hour * 60;
  const slotEnd = slotStart + 60;
  const leftFraction = Math.max(0, startMinutes - slotStart) / 60;
  const rightFraction = Math.max(0, slotEnd - endMinutes) / 60;
  return { leftFraction, rightFraction };
};

const getQuadrantRecordColorClasses = (record: WorkdayRecord): string => {
  if (getDisplayRecordStatus(record) === "ABSENT") {
    return "bg-slate-400 shadow-slate-100";
  }

  if (getDisplayRecordStatus(record) === "INCIDENT") {
    return "bg-rose-500 shadow-rose-100";
  }

  if (getDisplayRecordStatus(record) === "OPEN") {
    return "bg-amber-500 shadow-amber-100";
  }

  switch (getDisplayTrustLevel(record)) {
    case "CORRECT":
      return "bg-emerald-500 shadow-emerald-100";
    case "REVIEW":
      return "bg-sky-500 shadow-sky-100";
    default:
      return "bg-slate-400 shadow-slate-100";
  }
};

const getStatusDetail = (record: WorkdayRecord): string => {
  if (
    record.requiresAdminValidation &&
    record.adminValidationStatus === "PENDING"
  ) {
    const reasonLabel = getAdminValidationReasonLabel(record);
    const incidentDetails = record.incidentFlags?.length
      ? record.incidentFlags.map(getIncidentFlagMessage).join(", ")
      : null;

    if (reasonLabel && incidentDetails) {
      return `${reasonLabel}. ${incidentDetails}.`;
    }

    if (reasonLabel) {
      return `${reasonLabel}.`;
    }

    if (incidentDetails) {
      return `${incidentDetails}.`;
    }

    return "Fichaje para revisar.";
  }

  if (record.status === "COMPLETED") {
    return "Fichaje completado sin problemas.";
  }

  if (record.status === "INCOMPLETE") {
    return "Falta fichaje de salida";
  }

  if (record.status === "OPEN") {
    return "Salida pendiente";
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
    return "Registro para revisar sin detalle adicional.";
  }

  const messages = record.incidentFlags.map(getIncidentFlagMessage);

  return messages.join(", ");
};

const getStatusDetailItems = (record: WorkdayRecord): string[] => {
  const items: string[] = [];

  if (
    record.requiresAdminValidation &&
    record.adminValidationStatus === "PENDING"
  ) {
    const reasonLabel = getAdminValidationReasonLabel(record);
    if (reasonLabel) {
      items.push(reasonLabel);
    }
  }

  if (record.incidentFlags?.length) {
    items.push(...record.incidentFlags.map(getIncidentFlagMessage));
  }

  if (items.length === 0) {
    items.push(getStatusDetail(record).replace(/\.$/, ""));
  }

  return Array.from(new Set(items));
};

const getStatusDetailItemClass = (record: WorkdayRecord): string =>
  record.status === "OPEN"
    ? "border-amber-500 bg-transparent text-amber-700"
    : "border-sky-200 bg-sky-50 text-sky-700";

const getStatusDetailItemOnWhiteClass = (record: WorkdayRecord): string =>
  record.status === "OPEN"
    ? "border-amber-500 text-amber-700"
    : "border-sky-200 text-sky-700";

const shouldRenderStatusDetailItems = (record: WorkdayRecord): boolean =>
  record.status !== "COMPLETED" ||
  Boolean(record.incidentFlags?.length) ||
  record.requiresAdminValidation ||
  Boolean(record.adminValidationReason);

const JUSTIFIABLE_INCIDENT_FLAGS: IncidentFlag[] = [
  "DURATION_TOO_SHORT",
  "DURATION_TOO_LONG",
  "OUT_OF_SCHEDULE",
];
const COORDINATOR_REVIEWABLE_INCIDENT_FLAGS: IncidentFlag[] = [
  "OUT_OF_SCHEDULE",
  "DURATION_TOO_SHORT",
  "DURATION_TOO_LONG",
];

const hasJustifiableIncident = (flags: IncidentFlag[] | null): boolean =>
  Boolean(flags?.some((flag) => JUSTIFIABLE_INCIDENT_FLAGS.includes(flag)));

const hasCoordinatorReviewableIncident = (flags: IncidentFlag[] | null): boolean =>
  Boolean(
    flags?.some((flag) => COORDINATOR_REVIEWABLE_INCIDENT_FLAGS.includes(flag)),
  );

const getCoordinatorIncidentDetail = (record: WorkdayRecord): string => {
  const hourMessages =
    record.incidentFlags
      ?.filter((flag) => COORDINATOR_REVIEWABLE_INCIDENT_FLAGS.includes(flag))
      .map(getIncidentFlagMessage) ?? [];

  if (hourMessages.length > 0) {
    return hourMessages.join(", ");
  }

  if (record.workedMinutes <= 0) {
    return "No hay tiempo trabajado registrado en esta jornada.";
  }

  return "Revisa la duración total trabajada de esta jornada.";
};

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
  headerSlot,
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
  const selectedMonthStorageKey = useMemo(
    () => `time-control:selected-month:${mode}:${session.email}`,
    [mode, session.email],
  );
  const [records, setRecords] = useState<WorkdayRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  
  const [viewedTabs, setViewedTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<WorkdayAdjustmentRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [incidentJustifications, setIncidentJustifications] = useState<
    WorkdayIncidentJustification[]
  >([]);
  const [
    dismissedApprovedIncidentRecordIds,
    setDismissedApprovedIncidentRecordIds,
  ] = useState<string[]>([]);
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
  const [
    pendingIncidentJustificationsLoading,
    setPendingIncidentJustificationsLoading,
  ] = useState(true);
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

  const [selectedMonth, setSelectedMonth] = useState<string>(getTodaySqlDate().slice(0, 7));
  const [trackerCalendarMonth, setTrackerCalendarMonth] = useState<string>(
    getTodaySqlDate().slice(0, 7),
  );
  const [reviewModalMonth, setReviewModalMonth] = useState<string>(
    getTodaySqlDate().slice(0, 7),
  );
  const [reviewModalSelectedDate, setReviewModalSelectedDate] = useState<
    string | null
  >(null);
const [filterValidationStatus, setFilterValidationStatus] = useState<string>("ALL");  const [managerUserFilter, setManagerUserFilter] = useState("");
  const [managerUserSearch, setManagerUserSearch] = useState("");
  const [managerDateFrom, setManagerDateFrom] = useState("");
  const [managerDateTo, setManagerDateTo] = useState("");
  const [managerHourFrom, setManagerHourFrom] = useState("");
  const [managerHourTo, setManagerHourTo] = useState("");
  const [managerTrustFilter, setManagerTrustFilter] = useState<
    "" | DisplayWorkdayTrustLevel
  >("");
  const [trackerUserFilter, setTrackerUserFilter] = useState("");
  const [trackerUserSearch, setTrackerUserSearch] = useState("");
  const [trackerStatusFilter, setTrackerStatusFilter] = useState<
    "" | DisplayWorkdayStatus
  >("");
  const [trackerTrustFilter, setTrackerTrustFilter] = useState<
    "" | DisplayWorkdayTrustLevel
  >("");

  // Filtros para las pestañas de solicitudes (tanto trabajador como manager)
  const [requestsDateFrom, setRequestsDateFrom] = useState("");
  const [requestsDateTo, setRequestsDateTo] = useState("");
  const [requestsStatusFilter, setRequestsStatusFilter] = useState("");
  const [requestsUserFilter, setRequestsUserFilter] = useState("");
  const [requestsUserSearch, setRequestsUserSearch] = useState("");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("");
  const [incidentUserFilter, setIncidentUserFilter] = useState("");
  const [incidentUserSearch, setIncidentUserSearch] = useState("");
  const [incidentRecordStatusFilter, setIncidentRecordStatusFilter] = useState<
    "" | WorkdayStatus
  >("");
  const [incidentRecordUserFilter, setIncidentRecordUserFilter] = useState("");
  const [incidentRecordUserSearch, setIncidentRecordUserSearch] = useState("");
  const [incidentRecordDateFrom, setIncidentRecordDateFrom] = useState("");
  const [incidentRecordDateTo, setIncidentRecordDateTo] = useState("");
  const [incidentRecordTrustFilter, setIncidentRecordTrustFilter] = useState<
    "" | DisplayWorkdayTrustLevel
  >("");

  const clearRequestFilters = () => {
    setRequestsDateFrom("");
    setRequestsDateTo("");
    setRequestsStatusFilter("");
    setRequestsUserFilter("");
    setRequestsUserSearch("");
  };
  const clearTrackerFilters = () => {
    setTrackerUserFilter("");
    setTrackerUserSearch("");
    setTrackerStatusFilter("");
    setTrackerTrustFilter("");
  };
  const clearIncidentFilters = () => {
    setIncidentStatusFilter("");
    setIncidentUserFilter("");
    setIncidentUserSearch("");
  };
  const clearIncidentRecordFilters = () => {
    setIncidentRecordStatusFilter("");
    setIncidentRecordUserFilter("");
    setIncidentRecordUserSearch("");
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
  const [selectedRecordForDetail, setSelectedRecordForDetail] =
    useState<WorkdayRecord | null>(null);
  const [adminCloseRecord, setAdminCloseRecord] =
    useState<WorkdayRecord | null>(null);
  const [adminCloseReturnRecord, setAdminCloseReturnRecord] =
    useState<WorkdayRecord | null>(null);
  const [adminCloseCheckOutAt, setAdminCloseCheckOutAt] = useState("");
  const [adminCloseComment, setAdminCloseComment] = useState("");
  const [adminCloseSubmitting, setAdminCloseSubmitting] = useState(false);
  const [openWorkdayWarning, setOpenWorkdayWarning] = useState<{
    record: WorkdayRecord;
    level: "warning" | "critical";
    minutesOpen: number;
  } | null>(null);
  const [selectedIncidentRecordId, setSelectedIncidentRecordId] = useState<
    string | null
  >(null);
  const [incidentJustificationReason, setIncidentJustificationReason] =
    useState("");
  const [adjustmentRequestToDelete, setAdjustmentRequestToDelete] =
    useState<WorkdayAdjustmentRequest | null>(null);
  const [deletingAdjustmentRequestId, setDeletingAdjustmentRequestId] =
    useState<string | null>(null);
  const [incidentJustificationToDelete, setIncidentJustificationToDelete] =
    useState<WorkdayIncidentJustification | null>(null);
  const [deletingIncidentJustificationId, setDeletingIncidentJustificationId] =
    useState<string | null>(null);
  const [selectedDetailDate, setSelectedDetailDate] = useState<string | null>(
    null,
  );
  const [selectedDetailUserId, setSelectedDetailUserId] = useState<
    string | null
  >(null);
  const [selectedOverflowDate, setSelectedOverflowDate] = useState<
    string | null
  >(null);
  const [managerDailyListType, setManagerDailyListType] = useState<
    "checked-in" | "missing" | "exclusions" | null
  >(null);
  const [showRemoteWorkModal, setShowRemoteWorkModal] = useState(false);
  const [showManagerIncidentsModal, setShowManagerIncidentsModal] =
    useState(false);
  const [trackerTooltip, setTrackerTooltip] = useState<{
    x: number;
    y: number;
    member: { name: string };
    record: WorkdayRecord;
  } | null>(null);
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
  const lastLoadRecordsErrorRef = useRef<string | null>(null);
  const loadRecordsPromiseRef = useRef<Promise<void> | null>(null);
  const loadRecordsQueuedRef = useRef(false);
  const [actionPopup, setActionPopup] = useState<{
    tone: "loading";
    message: string;
  } | null>(null);
  const pendingRequestsSectionRef = useRef<HTMLDivElement | null>(null);
  const workerCalendarScrollRef = useRef<HTMLDivElement | null>(null);
  const trackerGridScrollRef = useRef<HTMLDivElement | null>(null);
  const workerCalendarTouchStartXRef = useRef<number | null>(null);
  const workerCalendarTouchScrollLeftRef = useRef(0);
  const recordsSectionRef = useRef<HTMLDivElement | null>(null);

  const openRecord = useMemo(
    () => records.find((record) => record.status === "OPEN") ?? null,
    [records],
  );
const filteredRecords = useMemo(() => {
    const recordsInScope =
      mode === "manager"
        ? records
        : records.filter((record) => record.workDate.startsWith(selectedMonth));

    return recordsInScope
      .map((record) => {
        // 1. FILTRADO Y LIMPIEZA EXCLUSIVA PARA EL "Responsable"
        if (mode === "manager" && session?.role === "Responsable") {
          if (record.status === "INCIDENT" && record.incidentFlags) {
            
            // Filtramos el array de errores para dejarle SOLO los relacionados con horas
            const timeFlags = record.incidentFlags.filter((flag) =>
              COORDINATOR_REVIEWABLE_INCIDENT_FLAGS.includes(flag)
            );

            // CASO A: Si tras la limpieza no queda ninguna bandera de tiempo,
            // significa que era una anomalía puramente de GPS/Dispositivo. La descartamos (null).
            if (timeFlags.length === 0) {
              return null;
            }

            // CASO B: Si tenía errores mixtos, clonamos el registro pero 
            // le machacamos sus flags para que SOLO contenga los de horas.
            return {
              ...record,
              incidentFlags: timeFlags,
            };
          }
        }
        
        // Si es el Administrador general, el registro pasa intacto con todos sus errores
        return record;
      })
      // Eliminamos de la lista los registros que hemos marcado como null (los puramente de GPS/Dispositivo)
      .filter((record) => record !== null) as WorkdayRecord[];
  }, [records, selectedMonth, mode, session?.role]);
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
    const workDaysSoFar = monthDays.filter(
      (day) => !isWeekend(day) && day <= today,
    );
    // Días laborables totales del mes (para el objetivo mensual)
    const totalWorkDaysInMonth = monthDays.filter((day) => !isWeekend(day));

    const expectedSoFar = workDaysSoFar.length * 480;
    const totalExpected = totalWorkDaysInMonth.length * 480;

    return {
      expectedSoFar,
      totalExpected,
      balance: totalWorkedMinutesInMonth - expectedSoFar,
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
    const base =
      mode === "worker" ? "/api/time-control/me" : "/api/time-control/admin";
    const params = new URLSearchParams();
    if (mode === "worker") {
      if (monthRange.from) params.set("dateFrom", monthRange.from);
      if (monthRange.to) params.set("dateTo", monthRange.to);
    }
    return `${base}?${params.toString()}`;
  }, [mode, monthRange]);

  const canAccessManagementPanel = Boolean(
    session.role === "Admin" ||
    session.role === "Responsable" ||
    session.canManageTimeControlRequests,
  );
  const isCoordinatorManagerView = Boolean(
    isManagerMode && session.role === "Responsable",
  );
  const isFunctionalAdmin = Boolean(
    session.role === "Admin" || session.canManageTimeControlRequests,
  );
  const canReviewIncidentRequests = canAccessManagementPanel;
  const canReviewExclusionRequests = isFunctionalAdmin;
  const canViewTeamRecords = isFunctionalAdmin;
  const canReviewAdjustmentRequests = isFunctionalAdmin;
  const showCoordinatorModeBanner =
    isCoordinatorManagerView;
  const selectedDetailRecords = useMemo(() => {
    if (!selectedDetailDate) return [];
    const dayItems = recordsByDate.get(selectedDetailDate) ?? [];
    if (selectedDetailUserId) {
      return dayItems.filter((r) => r.userId === selectedDetailUserId);
    }
    return dayItems;
  }, [selectedDetailDate, recordsByDate, selectedDetailUserId]);

  const selectedDetailWorkedMinutes = useMemo(
    () =>
      selectedDetailRecords.reduce(
        (total, record) => total + record.workedMinutes,
        0,
      ),
    [selectedDetailRecords],
  );
  const selectedOverflowRecords = selectedOverflowDate
    ? (recordsByDate.get(selectedOverflowDate) ?? [])
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
          ]),
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
  const normalizedManagerUserSearch = managerUserSearch
    .trim()
    .toLocaleLowerCase("es-ES");
  const normalizedTrackerUserSearch = trackerUserSearch
    .trim()
    .toLocaleLowerCase("es-ES");
  const normalizedRequestsUserSearch = requestsUserSearch
    .trim()
    .toLocaleLowerCase("es-ES");
  const normalizedIncidentUserSearch = incidentUserSearch
    .trim()
    .toLocaleLowerCase("es-ES");
  const normalizedIncidentRecordUserSearch = incidentRecordUserSearch
    .trim()
    .toLocaleLowerCase("es-ES");

  const getDisplayUserName = (
    userId: string,
    userName?: string | null,
  ): string => {
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
      teamMembers.filter(
        (member) => !excludedFromTodayTrackingIds.has(member.id),
      ),
    [excludedFromTodayTrackingIds, teamMembers],
  );

  const managerVisibleRecords = useMemo(() => {
    return filteredRecords.filter((record) => {
      if (managerUserFilter) {
        if (record.userId !== managerUserFilter) {
          return false;
        }
      } else if (normalizedManagerUserSearch) {
        const displayName = getDisplayUserName(
          record.userId,
          record.userName,
        ).toLocaleLowerCase("es-ES");

        if (!displayName.includes(normalizedManagerUserSearch)) {
          return false;
        }
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

      if (
        managerTrustFilter &&
        getDisplayTrustLevel(record) !== managerTrustFilter
      ) {
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
    normalizedManagerUserSearch,
    filteredRecords,
  ]);
  const managerIncidentRecords = useMemo(
    () =>
      filteredRecords.filter((record) => {
        if (record.status !== "INCIDENT" && record.status !== "INCOMPLETE") {
          return false;
        }

        if (!isCoordinatorManagerView) {
          return true;
        }

        return hasCoordinatorReviewableIncident(record.incidentFlags);
      }),
    [isCoordinatorManagerView, filteredRecords],
  );
  const filteredManagerIncidentRecords = useMemo(
    () =>
      managerIncidentRecords.filter((record) => {
        if (
          incidentRecordStatusFilter &&
          record.status !== incidentRecordStatusFilter
        ) {
          return false;
        }

        if (
          incidentRecordUserFilter &&
          record.userId !== incidentRecordUserFilter
        ) {
          return false;
        }

        if (!incidentRecordUserFilter && normalizedIncidentRecordUserSearch) {
          const displayName = getDisplayUserName(
            record.userId,
            record.userName,
          ).toLocaleLowerCase("es-ES");
          if (!displayName.includes(normalizedIncidentRecordUserSearch)) {
            return false;
          }
        }

        if (
          incidentRecordDateFrom &&
          record.workDate < incidentRecordDateFrom
        ) {
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
      normalizedIncidentRecordUserSearch,
      managerIncidentRecords,
    ],
  );
  const managerIncidentUsersCount = useMemo(
    () => new Set(managerIncidentRecords.map((record) => record.userId)).size,
    [managerIncidentRecords],
  );
  const trackerCalendarIncidentCounts = useMemo(() => {
    const counts = new Map<string, number>();

    managerIncidentRecords.forEach((record) => {
      counts.set(record.workDate, (counts.get(record.workDate) ?? 0) + 1);
    });

    return counts;
  }, [managerIncidentRecords]);
  const trackerCalendarWeeks = useMemo<CalendarDayCell[][]>(() => {
    const monthDays = getMonthDays(trackerCalendarMonth);
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
      cells.push({
        workDate,
        dayNumber: Number(workDate.slice(-2)),
        isWeekend: isWeekend(workDate),
        isToday: workDate === today,
        records: [],
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
  }, [trackerCalendarMonth]);
  const reviewModalRecordCounts = useMemo(() => {
    const counts = new Map<string, number>();

    filteredManagerIncidentRecords.forEach((record) => {
      counts.set(record.workDate, (counts.get(record.workDate) ?? 0) + 1);
    });

    return counts;
  }, [filteredManagerIncidentRecords]);
  const reviewModalCalendarWeeks = useMemo<CalendarDayCell[][]>(() => {
    const monthDays = getMonthDays(reviewModalMonth);
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
      cells.push({
        workDate,
        dayNumber: Number(workDate.slice(-2)),
        isWeekend: isWeekend(workDate),
        isToday: workDate === today,
        records: [],
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
  }, [reviewModalMonth]);
  const modalManagerIncidentRecords = useMemo(
    () =>
      reviewModalSelectedDate
        ? filteredManagerIncidentRecords.filter(
            (record) => record.workDate === reviewModalSelectedDate,
          )
        : filteredManagerIncidentRecords,
    [filteredManagerIncidentRecords, reviewModalSelectedDate],
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
    filteredRecords
      .filter((r) => r.workDate === trackerDate)
      .forEach((r) => {
        const userRecords = map.get(r.userId) || [];
        userRecords.push(r);
        map.set(r.userId, userRecords);
      });
    return map;
  }, [filteredRecords, trackerDate]);

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
      totalExpectedTodayUsers.filter(
        (member) => !checkedInTrackerUserIds.has(member.id),
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
      remoteWorkTodayUsers.filter(
        (member) => checkedInTrackerUserIds.has(member.id), // <-- Aquí cambiamos el nombre
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

  const managerTrackerMembers = useMemo(
    () =>
      teamMembers.filter((member) => {
        if (trackerUserFilter && member.id !== trackerUserFilter) {
          return false;
        }

        if (!trackerUserFilter && normalizedTrackerUserSearch) {
          const displayName = member.name.toLocaleLowerCase("es-ES");
          if (!displayName.includes(normalizedTrackerUserSearch)) {
            return false;
          }
        }

        const userRecords = trackerDateRecordsMap.get(member.id) ?? [];

        if (
          trackerStatusFilter &&
          !userRecords.some(
            (record) => getDisplayRecordStatus(record) === trackerStatusFilter,
          )
        ) {
          return false;
        }

        if (
          trackerTrustFilter &&
          !userRecords.some(
            (record) => getDisplayTrustLevel(record) === trackerTrustFilter,
          )
        ) {
          return false;
        }

        return true;
      }),
    [
      teamMembers,
      trackerDateRecordsMap,
      trackerStatusFilter,
      trackerTrustFilter,
      trackerUserFilter,
      normalizedTrackerUserSearch,
    ],
  );

  const incidentJustificationsByRecordId = useMemo(
    () =>
      new Map(
        incidentJustifications
          .filter((justification) => !justification.hiddenByWorkerAt)
          .map((justification) => [justification.recordId, justification]),
      ),
    [incidentJustifications],
  );

  const hiddenRespondedIncidentRecordIds = useMemo(
    () =>
      new Set([
        ...dismissedApprovedIncidentRecordIds,
        ...incidentJustifications
          .filter(
            (justification) =>
              hasAdminResponseForIncidentJustification(justification) &&
              Boolean(justification.hiddenByWorkerAt),
          )
          .map((justification) => justification.recordId),
      ]),
    [dismissedApprovedIncidentRecordIds, incidentJustifications],
  );

  const justifiableIncidentRecords = useMemo(
    () =>
      records
        .filter(
          (record) =>
            record.status === "INCIDENT" &&
            hasJustifiableIncident(record.incidentFlags) &&
            !hiddenRespondedIncidentRecordIds.has(record.id),
        )
        .sort((left, right) => {
          const byDate = right.workDate.localeCompare(left.workDate);
          if (byDate !== 0) return byDate;
          return right.checkInAt.localeCompare(left.checkInAt);
        }),
    [hiddenRespondedIncidentRecordIds, records],
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
      ].sort((left, right) =>
        right.requestDate.localeCompare(left.requestDate),
      ),
    [myPermissionRequests, myRemoteWorkRequests],
  );

  const pendingUnifiedExclusionRequests = useMemo<
    UnifiedExclusionRequestItem[]
  >(
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
      ].sort((left, right) =>
        right.requestDate.localeCompare(left.requestDate),
      ),
    [pendingPermissionRequests, pendingRemoteWorkRequests],
  );

  // --- LÓGICA DE FILTRADO PARA SOLICITUDES ---

  // 1. Filtrado para el TRABAJADOR
  const filteredWorkerRequests = useMemo(() => {
    return requests.filter((req) => {
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter)
        return false;
      return true;
    });
  }, [requests, requestsDateFrom, requestsDateTo, requestsStatusFilter]);

  const filteredWorkerExclusions = useMemo(() => {
    return myUnifiedExclusionRequests.filter((req) => {
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter)
        return false;
      return true;
    });
  }, [
    myUnifiedExclusionRequests,
    requestsDateFrom,
    requestsDateTo,
    requestsStatusFilter,
  ]);

  const filteredWorkerIncidents = useMemo(() => {
    return justifiableIncidentRecords.filter((record) => {
      if (requestsDateFrom && record.workDate < requestsDateFrom) return false;
      if (requestsDateTo && record.workDate > requestsDateTo) return false;
      // Las anomalías por justificar del trabajador no tienen estado de solicitud per se hasta que se envían
      return true;
    });
  }, [justifiableIncidentRecords, requestsDateFrom, requestsDateTo]);

  // 2. Filtrado para el MANAGER
  const filteredManagerRequests = useMemo(() => {
    return pendingRequests.filter((req) => {
      if (requestsUserFilter && req.userId !== requestsUserFilter) return false;
      if (!requestsUserFilter && normalizedRequestsUserSearch) {
        const displayName = getDisplayUserName(
          req.userId,
          req.userName,
        ).toLocaleLowerCase("es-ES");
        if (!displayName.includes(normalizedRequestsUserSearch)) return false;
      }
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter)
        return false;
      return true;
    });
  }, [
    pendingRequests,
    requestsDateFrom,
    requestsDateTo,
    requestsStatusFilter,
    requestsUserFilter,
    normalizedRequestsUserSearch,
  ]);

  const filteredManagerIncidents = useMemo(() => {
    return pendingIncidentJustifications.filter((req) => {
      if (
        isCoordinatorManagerView &&
        !hasCoordinatorReviewableIncident(req.incidentFlags ?? null)
      ) {
        return false;
      }
      if (incidentUserFilter && req.userId !== incidentUserFilter) return false;
      if (!incidentUserFilter && normalizedIncidentUserSearch) {
        const displayName = getDisplayUserName(
          req.userId,
          req.userName,
        ).toLocaleLowerCase("es-ES");
        if (!displayName.includes(normalizedIncidentUserSearch)) return false;
      }
      if (incidentStatusFilter) {
        if (incidentStatusFilter === PENDING_ADMINISTRATION_FILTER_VALUE) {
          if (!matchesPendingAdministrationStatus(req.status)) return false;
        } else if (req.status !== incidentStatusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [
    isCoordinatorManagerView,
    pendingIncidentJustifications,
    incidentStatusFilter,
    incidentUserFilter,
    normalizedIncidentUserSearch,
  ]);

  const filteredManagerExclusions = useMemo(() => {
    return pendingUnifiedExclusionRequests.filter((req) => {
      if (requestsUserFilter && req.userId !== requestsUserFilter) return false;
      if (!requestsUserFilter && normalizedRequestsUserSearch) {
        const displayName = getDisplayUserName(
          req.userId,
          req.userName,
        ).toLocaleLowerCase("es-ES");
        if (!displayName.includes(normalizedRequestsUserSearch)) return false;
      }
      if (requestsDateFrom && req.requestDate < requestsDateFrom) return false;
      if (requestsDateTo && req.requestDate > requestsDateTo) return false;
      if (requestsStatusFilter && req.status !== requestsStatusFilter)
        return false;
      return true;
    });
  }, [
    pendingUnifiedExclusionRequests,
    requestsDateFrom,
    requestsDateTo,
    requestsStatusFilter,
    requestsUserFilter,
    normalizedRequestsUserSearch,
  ]);

  const managerPendingCount = filteredManagerRequests.length;
  const pendingExclusionCount = filteredManagerExclusions.length;

  const managerVisibleTabCount = [
    canReviewAdjustmentRequests,
    canReviewIncidentRequests,
    canViewTeamRecords,
    canReviewExclusionRequests,
  ].filter(Boolean).length;
  const managerMenuColsClass =
    managerVisibleTabCount <= 1
      ? "md:grid-cols-1"
      : managerVisibleTabCount === 2
        ? "md:grid-cols-2"
        : managerVisibleTabCount === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-4";
  const managerOverviewCardCount = [
    canReviewAdjustmentRequests,
    canReviewExclusionRequests,
    canReviewIncidentRequests,
  ].filter(Boolean).length;
  const managerOverviewColsClass =
    managerOverviewCardCount <= 1
      ? "md:grid-cols-1"
      : managerOverviewCardCount === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 xl:grid-cols-3";

  useEffect(() => {
    if (!isManagerMode) return;

    const hasPermissionForTab = (tab: typeof managerReviewTab) => {
      if (tab === "records") return canViewTeamRecords;
      if (tab === "requests") return canReviewAdjustmentRequests;
      if (tab === "incidents") return canReviewIncidentRequests;
      if (tab === "exclusions") return canReviewExclusionRequests;
      return false;
    };

    if (!hasPermissionForTab(managerReviewTab)) {
      if (canViewTeamRecords) setManagerReviewTab("records");
      else if (canReviewAdjustmentRequests) setManagerReviewTab("requests");
      else if (canReviewIncidentRequests) setManagerReviewTab("incidents");
      else if (canReviewExclusionRequests) setManagerReviewTab("exclusions");
    }
  }, [
    isManagerMode,
    canReviewAdjustmentRequests,
    canReviewExclusionRequests,
    canReviewIncidentRequests,
    canViewTeamRecords,
    managerReviewTab,
  ]);

  const loadRecords = async (signal?: AbortSignal) => {
    if (loadRecordsPromiseRef.current) {
      if (!signal) {
        loadRecordsQueuedRef.current = true;
      }
      return loadRecordsPromiseRef.current;
    }

    const loadTask = (async () => {
      setLoading(true);
      try {
        const response = await fetch(endpointBase, { signal });
        const data = (await response.json()) as {
          items?: WorkdayRecord[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.error ||
              `Error ${response.status}: No se pudieron cargar los registros. Data: ${JSON.stringify(data)}`,
          );
        }

        setRecords(data.items ?? []);
        lastLoadRecordsErrorRef.current = null;
      } catch (error) {
        if (
          (signal && signal.aborted) ||
          (error instanceof DOMException && error.name === "AbortError") ||
          (error &&
            typeof error === "object" &&
            (error as any).name === "AbortError") ||
          (error &&
            typeof error === "object" &&
            String((error as any).message)
              .toLowerCase()
              .includes("abort")) ||
          (error &&
            typeof error === "object" &&
            String((error as any).message)
              .toLowerCase()
              .includes("cleanup"))
        ) {
          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : error && typeof error === "object" && "message" in error
                ? (error as any).message
                : "No se pudieron cargar los registros.";

        if (lastLoadRecordsErrorRef.current === errorMessage) {
          return;
        }

        lastLoadRecordsErrorRef.current = errorMessage;
        setToast({
          tone: "error",
          message: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    })();

    loadRecordsPromiseRef.current = loadTask;

    try {
      await loadTask;
    } finally {
      loadRecordsPromiseRef.current = null;

      if (loadRecordsQueuedRef.current && !signal?.aborted) {
        loadRecordsQueuedRef.current = false;
        void loadRecords();
      }
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
      const response = await fetch(
        "/api/time-control/incident-justifications/me",
      );
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
          remoteData.error ??
            "No se pudieron cargar las solicitudes de teletrabajo.",
        );
      }
      if (!permissionResponse.ok) {
        throw new Error(
          permissionData.error ??
            "No se pudieron cargar las solicitudes de permiso.",
        );
      }

      setMyRemoteWorkRequests(remoteData.items ?? []);
      setMyPermissionRequests(permissionData.items ?? []);
    } catch (error) {
      console.error(
        "Error al cargar solicitudes de teletrabajo/permiso:",
        error,
      );
      setMyRemoteWorkRequests([]);
      setMyPermissionRequests([]);
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
          data.error ?? "No se pudieron cargar las justificaciones pendientes.",
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
          remoteData.error ??
            "No se pudieron cargar solicitudes de teletrabajo.",
        );
      }
      if (!permissionResponse.ok) {
        throw new Error(
          permissionData.error ??
            "No se pudieron cargar solicitudes de permiso.",
        );
      }

      setPendingRemoteWorkRequests(remoteData.items ?? []);
      setPendingPermissionRequests(permissionData.items ?? []);
    } catch (error) {
      console.error(
        "Error al cargar solicitudes pendientes de teletrabajo/permiso:",
        error,
      );
      setPendingRemoteWorkRequests([]);
      setPendingPermissionRequests([]);
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
      console.error(
        "Error al cargar exclusiones del seguimiento diario:",
        error,
      );
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    void loadRecords(controller.signal);

    return () => {
      controller.abort("cleanup");
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
      setViewedTabs(
        Array.isArray(parsed)
          ? parsed.filter((item) => typeof item === "string")
          : [],
      );
    } catch {
      setViewedTabs([]);
    }
  }, [viewedTabsStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        viewedTabsStorageKey,
        JSON.stringify(viewedTabs),
      );
    } catch {
      // Ignore storage errors; the UI still works in-memory.
    }
  }, [viewedTabs, viewedTabsStorageKey]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(selectedMonthStorageKey);
      if (!raw || !/^\d{4}-\d{2}$/.test(raw)) {
        return;
      }

      setSelectedMonth(raw);
    } catch {
      // Ignore storage errors; the UI still works with the current month.
    }
  }, [selectedMonthStorageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(selectedMonthStorageKey, selectedMonth);
    } catch {
      // Ignore storage errors; the UI still works in-memory.
    }
  }, [selectedMonth, selectedMonthStorageKey]);

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
  }, [
    isManagerMode,
    canAccessManagementPanel,
    canReviewAdjustmentRequests,
    canReviewExclusionRequests,
    canReviewIncidentRequests,
  ]);

  useEffect(() => {
    if (!isManagerMode) return;
    void loadManagerTodayExclusions();
  }, [isManagerMode, trackerDate]);

  useEffect(() => {
    if (!isManagerMode || managerReviewTab !== "tracker") return;

    const container = trackerGridScrollRef.current;
    if (!container) return;

    const syncScrollPosition = () => {
      const targetHourCell = container.querySelector<HTMLElement>(
        `[data-tracker-hour="${TRACKER_DEFAULT_SCROLL_HOUR}"]`,
      );
      const stickyColumn = container.querySelector<HTMLElement>(
        "[data-tracker-worker-header='true']",
      );

      if (!targetHourCell) return;

      const stickyWidth = stickyColumn?.offsetWidth ?? 240;
      const nextScrollLeft = Math.max(
        0,
        targetHourCell.offsetLeft - stickyWidth - 16,
      );

      container.scrollTo({ left: nextScrollLeft, behavior: "auto" });
    };

    const frameId = window.requestAnimationFrame(syncScrollPosition);
    return () => window.cancelAnimationFrame(frameId);
  }, [isManagerMode, managerReviewTab, trackerDate, managerTrackerMembers.length]);

  useEffect(() => {
    const trackerMonthFromDate = trackerDate.slice(0, 7);
    setTrackerCalendarMonth((current) =>
      current === trackerMonthFromDate ? current : trackerMonthFromDate,
    );
  }, [trackerDate]);

  useEffect(() => {
    setSelectedDetailDate(null);
    setSelectedOverflowDate(null);
  }, [selectedMonth]);

  useEffect(() => {
    if (!isWorkerMode || !showWorkerOverview || !openRecord) {
      setOpenWorkdayWarning(null);
      return;
    }

    const minutesOpen = getOpenWorkdayMinutes(openRecord);
    const level =
      minutesOpen >= OPEN_WORKDAY_CRITICAL_MINUTES
        ? "critical"
        : minutesOpen >= OPEN_WORKDAY_WARNING_MINUTES
          ? "warning"
          : null;

    if (!level) {
      setOpenWorkdayWarning(null);
      return;
    }

    const storageKey = `time-control:open-workday-warning:${openRecord.id}:${level}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) {
        return;
      }
    } catch {
      // Si sessionStorage falla, seguimos mostrando el aviso una vez en memoria.
    }

    setOpenWorkdayWarning({
      record: openRecord,
      level,
      minutesOpen,
    });
  }, [isWorkerMode, openRecord, showWorkerOverview]);

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

  const postponeOpenWorkdayWarning = () => {
    if (openWorkdayWarning) {
      const storageKey = `time-control:open-workday-warning:${openWorkdayWarning.record.id}:${openWorkdayWarning.level}`;
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // No bloqueamos el cierre del aviso si el almacenamiento no está disponible.
      }
    }

    setOpenWorkdayWarning(null);
  };

  const closeOpenWorkdayFromWarning = async () => {
    postponeOpenWorkdayWarning();
    await submitAction(
      "/api/time-control/check-out",
      "Salida registrada correctamente.",
    );
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
        `${managerTodayExclusions.vacations.length} vacación${
          managerTodayExclusions.vacations.length === 1 ? "" : "es"
        }`,
      );
    }

    if (managerTodayExclusions.permissions.length > 0) {
      summaryParts.push(
        `${managerTodayExclusions.permissions.length} permiso${
          managerTodayExclusions.permissions.length === 1 ? "" : "s"
        }`,
      );
    }

    if (summaryParts.length === 0) {
      return "Sin exclusiones por vacaciones o permisos aprobados.";
    }

    return `Se excluyen ${summaryParts.join(" y ")} aprobados en la fecha seleccionada.`;
  }, [
    managerTodayExclusions.permissions.length,
    managerTodayExclusions.vacations.length,
  ]);

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
        throw new Error(
          "No se puede solicitar teletrabajo o permiso en días anteriores.",
        );
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
      status === "APPROVED"
        ? "Aprobando solicitud..."
        : "Rechazando solicitud...",
    );
    try {
      const trimmedReviewComment = (reviewComments[request.id] ?? "").trim();
      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error("Debes indicar un motivo para rechazar la solicitud.");
      }

      const isCoordinatorStep = request.status === "PENDING_COORDINATOR";
      const endpoint =
        request.kind === "REMOTE_WORK"
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
          "Debes indicar un motivo para justificar la anomalía.",
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
          data.error ?? "No se pudo enviar la justificación de la anomalía.",
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
            : "No se pudo enviar la justificación de la anomalía.",
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
        message: "Elemento ocultado correctamente.",
      });
      await loadIncidentJustifications();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo ocultar el elemento.",
      });
    } finally {
      setDeletingIncidentJustificationId(null);
    }
  };

  const deleteAdjustmentRequest = async () => {
    if (!adjustmentRequestToDelete) {
      return;
    }

    setDeletingAdjustmentRequestId(adjustmentRequestToDelete.id);
    showLoadingPopup("Ocultando solicitud...");
    try {
      const response = await fetch(
        `/api/time-control/adjustments/${adjustmentRequestToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "No se pudo ocultar la solicitud.",
          ),
        );
      }

      const hiddenAt = new Date().toISOString().slice(0, 23).replace("T", " ");
      setRequests((current) =>
        current.map((request) =>
          request.id === adjustmentRequestToDelete.id
            ? { ...request, hiddenByWorkerAt: hiddenAt }
            : request,
        ),
      );
      setAdjustmentRequestToDelete(null);
      hideLoadingPopup();
      setToast({
        tone: "success",
        message: "Solicitud ocultada correctamente.",
      });
      await loadRequests();
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo ocultar la solicitud.",
      });
    } finally {
      setDeletingAdjustmentRequestId(null);
    }
  };

  const reviewRequest = async (
    requestId: string,
    status: Extract<AdjustmentRequestStatus, "APPROVED" | "REJECTED">,
  ) => {
    setReviewSubmittingId(requestId);
    showLoadingPopup(
      status === "APPROVED"
        ? "Aprobando solicitud..."
        : "Rechazando solicitud...",
    );
    try {
      const trimmedReviewComment = (reviewComments[requestId] ?? "").trim();

      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error("Debes indicar un motivo para rechazar la solicitud.");
      }

      const request = pendingRequests.find((r) => r.id === requestId);
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
            ? isLegacyCoordinatorPending
              ? "Solicitud antigua aprobada correctamente."
              : "Solicitud aprobada correctamente."
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
        throw new Error(data.error ?? "No se pudo revisar la justificación.");
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

  const applyUpdatedRecord = (updatedRecord: WorkdayRecord) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === updatedRecord.id ? updatedRecord : record,
      ),
    );
    setSelectedRecordForDetail((current) =>
      current?.id === updatedRecord.id ? updatedRecord : current,
    );
  };

  const reviewRecordAdminValidation = async (
    recordId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    setReviewSubmittingId(recordId);
    showLoadingPopup(
      status === "APPROVED"
        ? "Validando fichaje..."
        : "Rechazando validación...",
    );

    try {
      const trimmedReviewComment = (reviewComments[recordId] ?? "").trim();

      if (status === "REJECTED" && !trimmedReviewComment) {
        throw new Error("Debes indicar un motivo para rechazar el fichaje.");
      }

      const response = await fetch(
        `/api/time-control/records/${recordId}/admin-validation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            comment: trimmedReviewComment,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, "No se pudo revisar el fichaje."),
        );
      }

      const data = (await response.json()) as {
        item?: WorkdayRecord;
        error?: string;
      };

      if (data.item) {
        applyUpdatedRecord(data.item);
      }

      setReviewComments((current) => ({
        ...current,
        [recordId]: "",
      }));

      await loadRecords();
      hideLoadingPopup();
      setToast({
        tone: "success",
        message:
          status === "APPROVED"
            ? "Fichaje validado correctamente."
            : "Fichaje rechazado correctamente.",
      });
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo revisar el fichaje.",
      });
    } finally {
      setReviewSubmittingId(null);
    }
  };

  const openAdminCloseModal = (record: WorkdayRecord) => {
    setAdminCloseRecord(record);
    setAdminCloseReturnRecord(record);
    setSelectedRecordForDetail(null);
    setAdminCloseCheckOutAt(
      sqlDateTimeToDateTimeLocal(record.checkOutAt ?? record.checkInAt),
    );
    setAdminCloseComment("");
  };

  const closeAdminCloseModal = () => {
    setAdminCloseRecord(null);
    setAdminCloseCheckOutAt("");
    setAdminCloseComment("");
    if (adminCloseReturnRecord) {
      setSelectedRecordForDetail(adminCloseReturnRecord);
      setAdminCloseReturnRecord(null);
    }
  };

  const closeRecordAsAdmin = async () => {
    if (!adminCloseRecord) {
      return;
    }

    setAdminCloseSubmitting(true);
    showLoadingPopup("Cerrando jornada...");

    try {
      const response = await fetch(
        `/api/time-control/records/${adminCloseRecord.id}/admin-close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checkOutAt: normalizeDateTimeLocalToSql(adminCloseCheckOutAt),
            comment: adminCloseComment.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "No se pudo cerrar la jornada.",
          ),
        );
      }

      const data = (await response.json()) as {
        item?: WorkdayRecord;
      };

      let updatedRecord: WorkdayRecord | null = null;
      if (data.item) {
        updatedRecord = data.item;
        applyUpdatedRecord(data.item);
      }

      await loadRecords();
      hideLoadingPopup();
      setAdminCloseRecord(null);
      setAdminCloseCheckOutAt("");
      setAdminCloseComment("");
      setAdminCloseReturnRecord(null);
      if (updatedRecord) {
        setSelectedRecordForDetail(updatedRecord);
      }
      setToast({
        tone: "success",
        message: "Jornada cerrada correctamente.",
      });
    } catch (error) {
      hideLoadingPopup();
      setToast({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo cerrar la jornada.",
      });
    } finally {
      setAdminCloseSubmitting(false);
    }
  };

  const renderRecordAdminValidationPanel = (record: WorkdayRecord) => {
    if (
      !isManagerMode ||
      !isFunctionalAdmin ||
      !isPendingAdminValidation(record)
    ) {
      return null;
    }

    return (
      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-lg bg-sky-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm shadow-sky-500/20">
              Revisión administrativa
            </span>
          </div>
          <p className="text-xs font-medium text-sky-900/80 leading-relaxed mt-1">
            Confirma la validez de la ubicación externa del fichaje o recházala
            indicando un motivo.
          </p>
        </div>

        <div className="mt-3.5 relative">
          <textarea
            className="h-24 w-full resize-none rounded-xl border border-sky-100 bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-500/10 shadow-inner"
            placeholder="Añade un comentario para la revisión (obligatorio al rechazar)..."
            value={reviewComments[record.id] ?? ""}
            onChange={(event) =>
              setReviewComments((current) => ({
                ...current,
                [record.id]: event.target.value,
              }))
            }
          />
        </div>

        <div className="mt-3 flex items-center justify-end gap-2.5 border-t border-sky-100/50 pt-3">
          <button
            type="button"
            className={`${POPUP_DANGER_BUTTON_CLASS} cursor-pointer text-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
            onClick={() => reviewRecordAdminValidation(record.id, "REJECTED")}
            disabled={reviewSubmittingId === record.id}
          >
            Rechazar
          </button>
          <button
            type="button"
            className={`${POPUP_PRIMARY_BUTTON_CLASS} cursor-pointer text-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
            onClick={() => reviewRecordAdminValidation(record.id, "APPROVED")}
            disabled={reviewSubmittingId === record.id}
          >
            Validar
          </button>
        </div>
      </div>
    );
  };

  const renderQuickActionsCard = (
    layout: "mobile" | "desktop" = "desktop",
  ) => {
    const wrapperClass =
      layout === "mobile"
        ? "rounded-xl border border-slate-200 bg-slate-50 p-3"
        : "w-[180px] rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm";
    const gridClass =
      layout === "mobile" ? "grid grid-cols-3 gap-2" : "grid grid-cols-1 gap-2";

    return (
<div className={wrapperClass}>
        {/* Cabecera de la sección respetando tu posición */}
        <p className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
          Acciones rápidas
        </p>

        {/* Contenedor dispuesto en vertical pura */}
        <div className="flex flex-col gap-3">
          
          {/* TARJETA 1: Fichar Entrada / Salida */}
          {isWorkerMode && (
            !openRecord ? (
              /* Estado: Iniciar Jornada */
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-200/80 hover:shadow-md">
                {/* AÑADIDO flex-1 y pr-4. ELIMINADO max-w-[200px] */}
                <div className="flex-1 space-y-0.5 pr-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Iniciar Jornada
                  </h3>
                  
                </div>
                <button
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() =>
                    submitAction(
                      "/api/time-control/check-in",
                      "Entrada registrada correctamente.",
                    )
                  }
                  disabled={submitting}
                >
                  <svg className="ml-0.5 h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Estado: Finalizar Jornada */
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-200/80 hover:shadow-md">
                {/* AÑADIDO flex-1 y pr-4. ELIMINADO max-w-[200px] */}
                <div className="flex-1 space-y-0.5 pr-4">
                  <h3 className="text-sm font-semibold text-rose-700">
                    Finalizar Jornada
                  </h3>
                  
                </div>
                <button
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() =>
                    submitAction(
                      "/api/time-control/check-out",
                      "Salida registrada correctamente.",
                    )
                  }
                  disabled={submitting}
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                </button>
              </div>
            )
          )}

          {/* TARJETA 2: Solicitar Fichaje */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-200/80 hover:shadow-md">
            {/* AÑADIDO flex-1 y pr-4. ELIMINADO max-w-[200px] */}
            <div className="flex-1 space-y-0.5 pr-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Solicitar Fichaje
              </h3>
              
            </div>
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 active:scale-95"
              onClick={() => setShowRequestModal(true)}
            >
              <i className="ti ti-edit text-[18px]" aria-hidden="true" />
            </button>
          </div>

          {/* TARJETA 3: Ayuda Ubicación */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-200/80 hover:shadow-md">
            {/* AÑADIDO flex-1 y pr-4. ELIMINADO max-w-[200px] */}
            <div className="flex-1 space-y-0.5 pr-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Ayuda Ubicación
              </h3>
              
            </div>
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition-all duration-200 hover:scale-105 hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setShowLocationHelp(true)}
              disabled={submitting}
            >
              <i className="ti ti-map-pin text-[18px]" aria-hidden="true" />
            </button>
          </div>

        </div>
      </div>
    );
  };

  const renderRecordDetailContent = (record: WorkdayRecord) => {
    const trustLevel = getDisplayTrustLevel(record);
    const trustLabel = getDisplayTrustLabel(record);
    const trustClass = TRUST_LEVEL_CLASSES[trustLevel];
    const hasIncident = record.status === "INCIDENT";
    const displayStatus = STATUS_LABELS[getDisplayRecordStatus(record)];
    const expectedMinutes = 480;
    const workedPercent = Math.min(
      100,
      Math.round((record.workedMinutes / expectedMinutes) * 100),
    );

    const getMapsUrl = (lat: number | null, lng: number | null): string => {
      if (lat === null || lng === null) return "";
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    };

    if (isCoordinatorManagerView) {
      return (
        <div className="space-y-4 text-left">
          <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Fecha de jornada
                </span>
                <h4 className="mt-0.5 text-base font-semibold text-slate-800">
                  {formatShortDate(record.workDate)}
                </h4>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${CALENDAR_STATUS_BADGE_CLASSES[getDisplayRecordStatus(record)]}`}
              >
                {displayStatus}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Rango horario
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-mono text-xl font-bold tracking-tight text-slate-800">
                    {getRecordLine(record)}
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tiempo computado
                </span>
                <p className="mt-0.5 font-mono text-2xl font-black tracking-tight text-slate-900">
                  {formatHoursFromMinutes(record.workedMinutes)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
            <svg
              className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h6 className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Detalle horario revisable
              </h6>
              <p className="mt-1 text-sm font-medium leading-relaxed text-amber-900">
                {getCoordinatorIncidentDetail(record)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      
      <div className="space-y-5 text-left">
        <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Fecha de jornada
              </span>
              <h4 className="mt-0.5 text-base font-semibold text-slate-800">
                {formatShortDate(record.workDate)}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 font-sans">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${CALENDAR_STATUS_BADGE_CLASSES[getDisplayRecordStatus(record)]}`}
              >
                {displayStatus}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${trustClass}`}
                title={getTrustTooltip(record)}
              >
                <svg
                  className="mr-1 h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                {trustLabel}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Rango horario
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-mono text-xl font-bold tracking-tight text-slate-800">
                  {getRecordLine(record)}
                </span>
              </div>
            </div>
            <div className="shrink-0 sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tiempo computado
              </span>
              <p className="mt-0.5 font-mono text-2xl font-black tracking-tight text-slate-900">
                {formatHoursFromMinutes(record.workedMinutes)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-400">
              <span>Progreso de jornada</span>
              <span className="font-semibold text-slate-600">
                {workedPercent}% del objetivo
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                  record.status === "INCIDENT"
                    ? "from-rose-400 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                    : record.status === "COMPLETED"
                      ? "from-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      : "from-sky-400 to-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                }`}
                style={{ width: `${workedPercent}%` }}
              />
            </div>
          </div>

          {isManagerMode && isFunctionalAdmin && record.status === "OPEN" ? (
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                className={`${POPUP_PRIMARY_BUTTON_CLASS} inline-flex items-center gap-2 text-xs`}
                onClick={() => openAdminCloseModal(record)}
              >
                <i className="ti ti-lock-check text-[15px]" aria-hidden="true" />
                Cerrar jornada
              </button>
            </div>
          ) : null}
        </div>

        {record.adminCloseComment || record.closedByAdminAt ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                <i className="ti ti-lock-check text-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Jornada cerrada por administración
                </p>
                {record.adminCloseComment ? (
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {record.adminCloseComment}
                  </p>
                ) : (
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Esta jornada fue cerrada manualmente por administración.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Registro de eventos
            </h5>
            <span className="text-xs text-slate-400">
              Datos técnicos plegables
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-emerald-50 shadow-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Entrada registrada
                  </span>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">
                    {getDeviceTypeLabel(record.checkInDeviceType)}
                  </span>
                </div>
                <span className="font-mono text-lg font-bold text-slate-800">
                  {formatTimeOnly(record.checkInAt)}
                </span>
              </div>
              <details className="group mt-2">
                <summary className="cursor-pointer list-none text-xs font-semibold text-slate-500 transition hover:text-sky-700">
                  Ver datos técnicos de entrada
                </summary>
                <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">IP:</span>{" "}
                    {record.checkInIpAddress || "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-700">
                      Ubicación:
                    </span>
                    {record.checkInLatitude !== null &&
                    record.checkInLongitude !== null ? (
                      <a
                        href={getMapsUrl(
                          record.checkInLatitude,
                          record.checkInLongitude,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      >
                        <svg
                          className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {record.checkInLatitude.toFixed(6)},{" "}
                        {record.checkInLongitude.toFixed(6)}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>
              </details>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/30 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-400 ring-4 ring-rose-50 shadow-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                    Salida registrada
                  </span>
                  {record.checkOutAt ? (
                    <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">
                      {getDeviceTypeLabel(record.checkOutDeviceType)}
                    </span>
                  ) : null}
                </div>
                <span className="font-mono text-lg font-bold text-slate-800">
                  {record.checkOutAt
                    ? formatTimeOnly(record.checkOutAt)
                    : "Sin registrar"}
                </span>
              </div>
              {record.checkOutAt ? (
                <details className="group mt-2">
                  <summary className="cursor-pointer list-none text-xs font-semibold text-slate-500 transition hover:text-sky-700">
                    Ver datos técnicos de salida
                  </summary>
                  <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-700">IP:</span>{" "}
                      {record.checkOutIpAddress || "—"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-700">
                        Ubicación:
                      </span>
                      {record.checkOutLatitude !== null &&
                      record.checkOutLongitude !== null ? (
                        <a
                          href={getMapsUrl(
                            record.checkOutLatitude,
                            record.checkOutLongitude,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                        >
                          <svg
                            className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {record.checkOutLatitude.toFixed(6)},{" "}
                          {record.checkOutLongitude.toFixed(6)}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        </div>

        {hasIncident && (
          <div className="flex items-start rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
            <svg
              className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-sky-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h6 className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Motivos de revisión
              </h6>
              <div className="mt-2 flex flex-wrap gap-2">
                {getStatusDetailItems(record).map((item) => (
                  <span
                    key={`${record.id}-detail-${item}`}
                    className={`inline-flex rounded-full border bg-white px-3 py-1.5 text-xs font-semibold leading-5 shadow-sm ${getStatusDetailItemOnWhiteClass(record)}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {renderRecordAdminValidationPanel(record)}
      </div>
    );
  };

  const handleWorkerCalendarTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    const container = workerCalendarScrollRef.current;
    const touch = event.touches[0];
    if (!container || !touch) return;

    workerCalendarTouchStartXRef.current = touch.clientX;
    workerCalendarTouchScrollLeftRef.current = container.scrollLeft;
  };

  const handleWorkerCalendarTouchMove = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    const container = workerCalendarScrollRef.current;
    const startX = workerCalendarTouchStartXRef.current;
    const touch = event.touches[0];
    if (!container || startX === null || !touch) return;

    const deltaX = touch.clientX - startX;
    container.scrollLeft = workerCalendarTouchScrollLeftRef.current - deltaX;
  };

  const handleWorkerCalendarTouchEnd = () => {
    workerCalendarTouchStartXRef.current = null;
  };

  return (
    <>
      {/* Tracker slot tooltip */}
      {trackerTooltip && (() => {
        const rec = trackerTooltip.record;
        const checkIn = formatTimeOnly(rec.checkInAt);
        const checkOut = rec.checkOutAt ? formatTimeOnly(rec.checkOutAt) : "en curso";
        const status = getDisplayRecordStatus(rec);
        const flags = rec.incidentFlags ?? [];
        const statusLabel = STATUS_LABELS[status];
        const statusColor =
          status === "INCIDENT"
            ? "text-rose-600"
            : status === "OPEN"
              ? "text-amber-600"
              : status === "ABSENT"
                ? "text-slate-500"
                : getDisplayTrustLevel(rec) === "REVIEW"
                  ? "text-sky-600"
                  : "text-emerald-600";
        return (
          <div
            style={{
              position: "fixed",
              left: trackerTooltip.x + 12,
              top: trackerTooltip.y - 8,
              zIndex: 9999,
              pointerEvents: "none",
              transform: trackerTooltip.x > window.innerWidth - 220 ? "translateX(-110%)" : undefined,
            }}
            className="rounded-xl border border-slate-200 bg-white shadow-xl px-3 py-2.5 text-sm min-w-[160px]"
          >
            <p className="font-semibold text-slate-800 mb-1">{trackerTooltip.member.name}</p>
            <p className="text-slate-500 text-xs mb-1">{checkIn} → {checkOut}</p>
            <p className={`font-semibold text-xs ${statusColor}`}>{statusLabel}</p>
            {flags.length > 0 && (
              <ul className="mt-1.5 border-t border-slate-100 pt-1.5 space-y-0.5">
                {flags.map((f) => (
                  <li key={f} className="text-slate-500 text-xs">{getIncidentFlagMessage(f)}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })()}
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
      <section
        className={`relative ${showWorkerOverview ? "flex flex-col gap-6 xl:flex-row xl:items-start" : "space-y-4"}`}
      >
        <div className="flex-1 min-w-0 space-y-4 overflow-visible">
          {headerSlot ? (
            <div className="relative">
              <div className="min-w-0">{headerSlot}</div>
              {showWorkerOverview ? (
                <div className="hidden xl:block absolute top-2 -right-48 z-10">
                  {renderQuickActionsCard("desktop")}
                </div>
              ) : null}
            </div>
          ) : showWorkerOverview ? (
            <div className="hidden xl:flex justify-end">
              {renderQuickActionsCard("desktop")}
            </div>
          ) : null}
          {isWorkerMode ? (
            <>
              {showWorkerOverview ? (
                <>
                  <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-6 w-full">
                    {/* TARJETA: ESTADO DE HOY */}
                    <div className="relative flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Estado de hoy
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            {openRecord && (
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                            )}
                            <p className="text-xl font-bold tracking-tight text-slate-900">
                              {openRecord
                                ? "Jornada abierta"
                                : "Sin jornada abierta"}
                            </p>
                          </div>

                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {openRecord
                              ? `Abierta desde ${formatDateTime(openRecord.checkInAt)}.`
                              : "Última entrada registrada."}
                          </p>
                        </div>

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            openRecord
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          {openRecord ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* TARJETA: HORAS TOTALES */}
                    <div className="relative flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Horas totales en {formatMonthLabel(selectedMonth)}
                          </p>
                          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                            {formatHoursFromMinutes(
                              totalWorkedMinutesInMonth,
                            )}H
                          </p>
                        </div>

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {/* Acciones rápidas - SOLO MÓVIL (hasta 1280px) */}
                    <div className="xl:hidden">
                      {renderQuickActionsCard("mobile")}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="border-t border-slate-100 pt-5">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-slate-900">
                              Histórico de fichajes
                            </h4>
                            <p className="text-sm text-slate-600">
                              Aquí puedes consultar los fichajes del mes
                              seleccionado, incluidos los realizados en fin de
                              semana.
                            </p>
                          </div>
                          <div className="flex items-center gap-1 self-start">
                            <Button
                              variant="secondary"
                              onClick={() =>
                                setSelectedMonth((current) =>
                                  shiftMonthValue(current, -1),
                                )
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
                                setSelectedMonth((current) =>
                                  shiftMonthValue(current, 1),
                                )
                              }
                            >
                              {">"}
                            </Button>
                          </div>
                        </div>

                        {loading ? (
                          <p className="text-sm text-slate-500">
                            Cargando registros...
                          </p>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                Cerrado
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                Abierta
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                                Ausente
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-200 border border-slate-300" />
                                Fin de semana
                              </span>
                            </div>

                            <div
                              ref={workerCalendarScrollRef}
                              className="overflow-x-auto pb-4 custom-scrollbar touch-pan-x overscroll-x-contain"
                              style={{ WebkitOverflowScrolling: "touch" }}
                              onTouchStart={handleWorkerCalendarTouchStart}
                              onTouchMove={handleWorkerCalendarTouchMove}
                              onTouchEnd={handleWorkerCalendarTouchEnd}
                              onTouchCancel={handleWorkerCalendarTouchEnd}
                            >
                              <div className="min-w-[600px] lg:min-w-full space-y-3">
                                <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                                  {CALENDAR_WEEKDAY_LABELS.map(
                                    (label, index) => (
                                      <div
                                        key={label}
                                        className={`text-center text-xs font-semibold uppercase tracking-wide ${index >= 5 ? "text-rose-500" : "text-slate-500"}`}
                                      >
                                        {label}
                                      </div>
                                    ),
                                  )}
                                </div>

                                {calendarWeeks.map((week, weekIndex) => (
                                  <div
                                    key={`week-${weekIndex}`}
                                    className="grid grid-cols-7 gap-1.5 sm:gap-3"
                                  >
                                    {week.map((cell, cellIndex) => {
                                      if (
                                        !cell.workDate ||
                                        cell.dayNumber === null
                                      ) {
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
                                      const visibleRecords = cell.records.slice(
                                        0,
                                        2,
                                      );
                                      const hiddenRecordsCount = Math.max(
                                        cell.records.length -
                                          visibleRecords.length,
                                        0,
                                      );
                                      const baseCellClass =
                                        getCalendarCellClasses(
                                          cell.isWeekend,
                                          cell.isToday,
                                        );

                                      return (
                                        <div
                                          key={cell.workDate}
                                          className={`min-h-[90px] sm:min-h-[120px] rounded-xl sm:rounded-2xl border p-1.5 sm:p-3 shadow-sm ${baseCellClass} ${
                                            hasDetail
                                              ? "cursor-pointer transition hover:bg-slate-50/40 hover:ring-2 hover:ring-slate-200 hover:shadow-md"
                                              : ""
                                          }`}
                                          onClick={() =>
                                            hasDetail
                                              ? setSelectedDetailDate(
                                                  cell.workDate,
                                                )
                                              : undefined
                                          }
                                        >
                                          <div className="mb-2 flex justify-center">
                                            <div className="flex flex-col items-center text-center">
                                              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                                                {String(
                                                  cell.dayNumber,
                                                ).padStart(2, "0")}
                                              </span>
                                              {cell.isToday ? (
                                                <span
                                                  className={`text-[9px] sm:text-[11px] font-medium ${
                                                    cell.isWeekend
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
                                                      {
                                                        STATUS_LABELS[
                                                          getDisplayRecordStatus(
                                                            record,
                                                          )
                                                        ]
                                                      }
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}

                                              {hiddenRecordsCount > 0 ? (
                                                <button
                                                  type="button"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedOverflowDate(
                                                      cell.workDate,
                                                    );
                                                  }}
                                                  className={`rounded-lg border border-dashed px-1 py-0.5 text-center text-[8px] sm:text-[10px] font-normal w-full ${
                                                    cell.isWeekend
                                                      ? "border-slate-300 bg-white text-slate-500"
                                                      : "border-slate-200 bg-white text-slate-500"
                                                  }`}
                                                >
                                                  +{hiddenRecordsCount}
                                                </button>
                                              ) : null}
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
                                No hay fichajes registrados para el mes
                                seleccionado.
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
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                          workerRequestsTab === "requests"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        Fichajes
                        {!viewedTabs.includes("worker-requests") &&
                        requests.length > 0 ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${workerRequestsTab === "requests" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}
                          >
                            {requests.length}
                          </span>
                        ) : null}
                      </button>

                      {/* 2. ANOMALÍAS */}
                      <button
                        type="button"
                        onClick={() => {
                          handleWorkerTabClick("incidents");
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                          workerRequestsTab === "incidents"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        Anomalías
                        {!viewedTabs.includes("worker-incidents") &&
                        justifiableIncidentRecords.length > 0 ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${workerRequestsTab === "incidents" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}
                          >
                            {justifiableIncidentRecords.length}
                          </span>
                        ) : null}
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Mes activo
                        </p>
                        <p className="text-sm text-slate-700">
                          Las solicitudes y anomalías se cargan para{" "}
                          <span className="font-medium text-slate-900">
                            {formatMonthLabel(selectedMonth)}
                          </span>
                          .
                        </p>
                      </div>
                      <div className="flex items-center gap-1 self-start">
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setSelectedMonth((current) =>
                              shiftMonthValue(current, -1),
                            )
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
                            setSelectedMonth((current) =>
                              shiftMonthValue(current, 1),
                            )
                          }
                        >
                          {">"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {workerRequestsTab === "incidents" ? (
                    <div
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                      style={tabPanelAnimationStyle}
                    >
                      <div className="mb-4 space-y-1">
                        <h3 className="text-base font-semibold text-slate-900">
                          Mis anomalías justificables
                        </h3>
                        <p className="text-sm text-slate-600">
                          Aquí puedes ver las anomalías que admiten
                          justificación y enviarla para revisión.
                        </p>
                      </div>

                      {loading || incidentJustificationsLoading ? (
                        <p className="text-sm text-slate-500">
                          Cargando anomalías justificables...
                        </p>
                      ) : justifiableIncidentRecords.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No tienes anomalías pendientes de justificar.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                            <Input
                              label="Desde"
                              type="date"
                              value={requestsDateFrom}
                              onChange={(e) =>
                                setRequestsDateFrom(e.target.value)
                              }
                            />
                            <Input
                              label="Hasta"
                              type="date"
                              value={requestsDateTo}
                              onChange={(e) =>
                                setRequestsDateTo(e.target.value)
                              }
                            />
                            <div className="flex items-end">
                              <Button
                              variant="secondary"
                              className="bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all"
                              onClick={clearRequestFilters}
                            >
                              Limpiar
                            </Button>
                            </div>
                          </div>

                          {loading || incidentJustificationsLoading ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                              Cargando anomalías justificables...
                            </p>
                          ) : filteredWorkerIncidents.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                              No hay anomalías que coincidan con los filtros.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {filteredWorkerIncidents.map((record) => {
                                const justification =
                                  incidentJustificationsByRecordId.get(
                                    record.id,
                                  );
                                const adminResponseText =
                                  justification?.adminComment ??
                                  justification?.coordinatorComment ??
                                  null;

                                return (
                                  <div
                                    key={`incident-justification-${record.id}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:p-5"
                                  >
                                    <div className="space-y-4">
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="space-y-3">
                                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                            <span className="font-medium text-slate-900">
                                            {formatShortDate(record.workDate)}
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-700">
                                              {getRecordLine(record)}
                                            </span>
                                          </div>

                                          <div className="flex flex-wrap gap-2">
                                            <span
                                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${CALENDAR_STATUS_BADGE_CLASSES[getDisplayRecordStatus(record)]}`}
                                            >
                                              {
                                                STATUS_LABELS[
                                                  getDisplayRecordStatus(record)
                                                ]
                                              }
                                            </span>
                                            {justification ? (
                                              <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${INCIDENT_JUSTIFICATION_STATUS_CLASSES[justification.status]}`}
                                              >
                                                {
                                                  INCIDENT_JUSTIFICATION_STATUS_LABELS[
                                                    justification.status
                                                  ]
                                                }
                                              </span>
                                            ) : null}
                                          </div>

                                          <div className="flex flex-wrap gap-2">
                                            {getStatusDetailItems(record).map((item) => (
                                              <span
                                                key={`${record.id}-${item}`}
                                                className={`inline-flex rounded-full border bg-white px-3 py-1.5 text-[11px] font-medium leading-5 shadow-sm ${getStatusDetailItemOnWhiteClass(record)}`}
                                              >
                                                {item}
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                        {justification &&
                                        hasAdminResponseForIncidentJustification(
                                          justification,
                                        ) ? (
                                          <button
                                            type="button"
                                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full border border-slate-200 bg-white text-base font-semibold leading-none text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
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
                                          <div className="self-start">
                                            <Button
                                              disabled={
                                                incidentJustificationSubmitting
                                              }
                                              onClick={() => {
                                                setSelectedIncidentRecordId(
                                                  record.id,
                                                );
                                                setIncidentJustificationReason("");
                                              }}
                                            >
                                              Justificar
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {justification ? (
                                      <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                          <div className="mb-3 flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                              <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.2}
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                                />
                                              </svg>
                                            </span>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                              Tu motivo
                                            </p>
                                          </div>
                                          <p className="leading-6 text-slate-700">
                                            {justification.reason}
                                          </p>
                                        </div>
                                        <div
                                          className={`rounded-2xl border p-5 shadow-sm ${
                                            adminResponseText
                                              ? "border-emerald-100 bg-emerald-50/60"
                                              : "border-amber-100 bg-amber-50/60"
                                          }`}
                                        >
                                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                              <span
                                                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                                  adminResponseText
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-amber-100 text-amber-700"
                                                }`}
                                              >
                                                {adminResponseText ? (
                                                  <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2.4}
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      d="M4.5 12.75l6 6 9-13.5"
                                                    />
                                                  </svg>
                                                ) : (
                                                  <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2.2}
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      d="M12 6v6l4 2"
                                                    />
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                  </svg>
                                                )}
                                              </span>
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Respuesta administración
                                              </p>
                                            </div>
                                            {!adminResponseText ? (
                                              <span className="rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                                Pendiente
                                              </span>
                                            ) : null}
                                          </div>
                                          <p className="leading-6 text-slate-700">
                                            {adminResponseText ??
                                              "Aún no hay respuesta de administración."}
                                          </p>
                                        </div>
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
                          Aquí puedes consultar el estado de las
                          regularizaciones que hayas pedido.
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
                              onChange={(e) =>
                                setRequestsDateFrom(e.target.value)
                              }
                            />
                            <Input
                              label="Hasta"
                              type="date"
                              value={requestsDateTo}
                              onChange={(e) =>
                                setRequestsDateTo(e.target.value)
                              }
                            />
                            <Select
                              id="requestsStatusFilter"
                              label="Estado"
                              value={requestsStatusFilter}
                              onChange={(e) =>
                                setRequestsStatusFilter(e.target.value)
                              }
                              options={[
                                { value: "", label: "Todos" },
                                {
                                  value: "PENDING_ADMIN",
                                  label: "Pendiente Administración",
                                },
                                { value: "APPROVED", label: "Aprobada" },
                                { value: "REJECTED", label: "Rechazada" },
                              ]}
                            />
                            <div className="flex items-end">
                              <Button
                              variant="secondary"
                              className="bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all"
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
                                  <div
                                    key={request.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all active:scale-[0.99]"
                                  >
                                      <div className="mb-4 flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Fecha
                                        </p>
                                        <p className="text-sm font-bold text-slate-900">
                                          {formatShortDate(request.requestDate)}
                                        </p>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span
                                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ADJUSTMENT_STATUS_CLASSES[request.status]}`}
                                        >
                                          {
                                            ADJUSTMENT_STATUS_LABELS[
                                              request.status
                                            ]
                                          }
                                        </span>
                                        {hasAdminResponseForAdjustmentRequest(
                                          request,
                                        ) ? (
                                          <button
                                            type="button"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-semibold leading-none text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                            onClick={() =>
                                              setAdjustmentRequestToDelete(
                                                request,
                                              )
                                            }
                                            aria-label="Eliminar solicitud respondida"
                                            title="Eliminar solicitud respondida"
                                          >
                                            ×
                                          </button>
                                        ) : null}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4 rounded-xl bg-slate-50 p-3">
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                          Tipo
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700">
                                          {
                                            ADJUSTMENT_TYPE_LABELS[
                                              request.requestType
                                            ]
                                          }
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                          Hora
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700">
                                          {formatTimeOnly(
                                            request.requestedTime,
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">
                                          Motivo
                                        </p>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                          {request.reason}
                                        </p>
                                      </div>
                                      {(request.status === "REJECTED" ||
                                        request.adminComment ||
                                        request.coordinatorComment) && (
                                        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                                          {request.status === "REJECTED" && (
                                            <div className="mb-2">
                                              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tight mb-1">
                                                Rechazada por
                                              </p>
                                              <p className="text-xs font-semibold text-rose-700">
                                                {request.reviewedByAdminId
                                                  ? "Administración"
                                                  : request.reviewedByCoordinatorId
                                                    ? "Coordinación"
                                                    : "-"}
                                              </p>
                                            </div>
                                          )}
                                          {(request.adminComment ||
                                            request.coordinatorComment) && (
                                            <div>
                                              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tight mb-1">
                                                Nota de revisión
                                              </p>
                                              <p className="text-xs text-rose-600 leading-relaxed italic">
                                                "
                                                {request.adminComment ??
                                                  request.coordinatorComment}
                                                "
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
                                      <th className="py-3 pr-4 pl-4 font-semibold uppercase tracking-wider text-[10px]">
                                        Fecha
                                      </th>
                                      <th className="py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">
                                        Tipo
                                      </th>
                                      <th className="py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">
                                        Hora
                                      </th>
                                      <th className="py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">
                                        Estado
                                      </th>
                                      <th className="min-w-[200px] py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">
                                        Motivo
                                      </th>
                                      <th className="min-w-[120px] py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">
                                        Rechazada
                                      </th>
                                      <th className="py-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">
                                        Nota
                                      </th>
                                      <th className="py-3 pr-4 font-semibold uppercase tracking-wider text-[10px] text-right">
                                        Acciones
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredWorkerRequests.map((request) => (
                                      <tr
                                        key={request.id}
                                        className="hover:bg-slate-50 transition-colors"
                                      >
                                        <td className="py-4 pr-4 pl-4 align-top font-medium text-slate-900">
                                          {formatShortDate(request.requestDate)}
                                        </td>
                                        <td className="py-4 pr-4 align-top">
                                          <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ADJUSTMENT_TYPE_CLASSES[request.requestType]}`}
                                          >
                                            {
                                              ADJUSTMENT_TYPE_LABELS[
                                                request.requestType
                                              ]
                                            }
                                          </span>
                                        </td>
                                        <td className="py-4 pr-4 align-top text-slate-600 tabular-nums">
                                          {formatTimeOnly(
                                            request.requestedTime,
                                          )}
                                        </td>
                                        <td className="py-4 pr-4 align-top">
                                          <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${ADJUSTMENT_STATUS_CLASSES[request.status]}`}
                                          >
                                            {
                                              ADJUSTMENT_STATUS_LABELS[
                                                request.status
                                              ]
                                            }
                                          </span>
                                        </td>
                                        <td className="py-4 pr-4 align-top text-slate-600 max-w-[250px]">
                                          <p className="whitespace-normal leading-relaxed">
                                            {request.reason}
                                          </p>
                                        </td>
                                        <td className="py-4 pr-4 align-top">
                                          {request.status !== "REJECTED" ? (
                                            "-"
                                          ) : (
                                            <span
                                              className={`inline-flex rounded-full border bg-transparent px-2 py-0.5 text-[10px] font-bold uppercase ${request.reviewedByAdminId ? "border-rose-500 text-rose-700" : "border-orange-500 text-orange-700"}`}
                                            >
                                              {request.reviewedByAdminId
                                                ? "Admin"
                                                : "Coordinador"}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-4 pr-4 align-top text-slate-500 italic max-w-[200px]">
                                          <p className="whitespace-normal leading-relaxed">
                                            {request.adminComment ??
                                              request.coordinatorComment ??
                                              "-"}
                                          </p>
                                        </td>
                                        <td className="py-4 pr-4 align-top text-right">
                                          {hasAdminResponseForAdjustmentRequest(
                                            request,
                                          ) ? (
                                            <button
                                              type="button"
                                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-base font-semibold leading-none text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                              onClick={() =>
                                                setAdjustmentRequestToDelete(
                                                  request,
                                                )
                                              }
                                              aria-label="Eliminar solicitud respondida"
                                              title="Eliminar solicitud respondida"
                                            >
                                              ×
                                            </button>
                                          ) : (
                                            <span className="text-slate-300">
                                              -
                                            </span>
                                          )}
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
              <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                {showCoordinatorModeBanner ? (
                  <div className="flex items-center gap-2.5 px-1 py-0.5 text-xs text-slate-500">
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700 ring-1 ring-inset ring-cyan-700/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
                      Vista de Coordinación
                    </span>
                    <p>
                      Aquí solo verás registros horarios por validar de los trabajadores de tu ámbito.
                    </p>
                  </div>
                ) : null}
                <div className={`grid gap-4 ${managerOverviewColsClass}`}>
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
                      <div className="absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="h-5 w-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                              />
                            </svg>
                          </div>
                          <span className="text-3xl font-black tracking-tight text-slate-900">
                            {managerPendingCount}
                          </span>
                        </div>

                        <div className="mt-5">
                          <h3 className="text-base font-bold text-slate-900">
                            Solicitudes pendientes
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {managerPendingCount === 0
                              ? "Todo al día."
                              : "Requieren tu aprobación inmediata."}
                          </p>
                        </div>

                        <div className="mt-auto pt-6">
                          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                            <span className="border-b border-indigo-100 group-hover:border-indigo-500 transition-colors">
                              Abrir solicitudes
                            </span>
                            <span className="ml-1 transition-transform group-hover:translate-x-1">
                              →
                            </span>
                          </span>
                        </div>
                      </div>
                    </button>
                  ) : null}

                  {/* 2. TELETRABAJO Y PERMISOS */}
                  {canReviewExclusionRequests ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleTabClick("exclusions");
                        scrollToSection(pendingRequestsSectionRef);
                      }}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-sky-300 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="h-5 w-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                              />
                            </svg>
                          </div>
                          <span className="text-3xl font-black tracking-tight text-slate-900">
                            {pendingExclusionCount}
                          </span>
                        </div>

                        <div className="mt-5">
                          <h3 className="text-base font-bold text-slate-900">
                            Teletrabajo y permisos
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Gestión de ausencias y trabajo remoto.
                          </p>
                        </div>

                        <div className="mt-auto pt-6">
                          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-sky-600">
                            <span className="border-b border-sky-100 group-hover:border-sky-500 transition-colors">
                              Revisar permisos
                            </span>
                            <span className="ml-1 transition-transform group-hover:translate-x-1">
                              →
                            </span>
                          </span>
                        </div>
                      </div>
                    </button>
                  ) : null}

                  {/* 3. ANOMALÍAS DEL EQUIPO */}
                  <button
                    type="button"
                    onClick={() => {
                      setReviewModalMonth(
                        reviewModalSelectedDate?.slice(0, 7) ??
                          filteredManagerIncidentRecords[0]?.workDate.slice(
                            0,
                            7,
                          ) ??
                          trackerDate.slice(0, 7),
                      );
                      setShowManagerIncidentsModal(true);
                    }}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-orange-50/65 transition-transform duration-500 group-hover:scale-[1.8]" />

                    <div className="relative flex h-full flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="h-6 w-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.35}
                              d="M12 8.75v3.35m-6.928 6.9h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                            <circle cx="12" cy="15.75" r="1.05" fill="currentColor" stroke="none" />
                          </svg>
                        </div>
                        <span className="text-3xl font-black tracking-tight text-slate-900">
                          {managerIncidentRecords.length}
                        </span>
                      </div>

                      <div className="mt-5">
                        <h3 className="text-base font-bold text-slate-900">
                          {isCoordinatorManagerView
                            ? "Registros horarios por validar"
                            : "Fichajes por revisar"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {isCoordinatorManagerView ? (
                            <>
                              <span className="font-semibold text-orange-600">
                                {managerIncidentUsersCount}
                              </span>{" "}
                              {managerIncidentUsersCount === 1
                                ? "trabajador con desajustes de horas."
                                : "trabajadores con desajustes de horas."}
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-orange-600">
                                {managerIncidentUsersCount}
                              </span>{" "}
                              {managerIncidentUsersCount === 1
                                ? "trabajador"
                                : "trabajadores"}{" "}
                              con anomalías.
                            </>
                          )}
                        </p>
                      </div>

                      <div className="mt-auto pt-6">
                        <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-orange-600">
                          <span className="border-b border-orange-100 group-hover:border-orange-500 transition-colors">
                            Abrir revisión
                          </span>
                          <span className="ml-1 transition-transform group-hover:translate-x-1">
                            →
                          </span>
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
                          Consulta quién ha fichado y quién falta en la fecha
                          seleccionada.
                        </p>
                      </div>

                      {/* Selector de fecha para seguimiento */}
                      <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-sm border border-slate-200">
                        <button
                          type="button"
                          onClick={() => adjustTrackerDate(-1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 19l-7-7 7-7"
                            />
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
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
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
                        <div className="absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" />

                        <div className="relative flex h-full flex-col">
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                              {/* Icono de Check / Usuario */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className="h-5 w-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                                />
                              </svg>
                            </div>
                            <span className="text-3xl font-black tracking-tight text-slate-900">
                              {checkedInTodayUsers.length}
                            </span>
                          </div>

                          <div className="mt-5">
                            <h3 className="text-base font-bold text-slate-900">
                              Fichados hoy
                            </h3>
                            {/* Barra de progreso sutil integrada */}
                            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                                style={{
                                  width: `${Math.min(100, (checkedInTodayUsers.length / (totalExpectedTodayUsers.length || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-500 italic">
                              {checkedInTodayUsers.length} de{" "}
                              {totalExpectedTodayUsers.length} esperados
                            </p>
                          </div>

                          <div className="mt-auto pt-6">
                            <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                              <span className="border-b border-emerald-100 group-hover:border-emerald-500 transition-colors">
                                Ver lista de entrada
                              </span>
                              <span className="ml-1 transition-transform group-hover:translate-x-1">
                                →
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. SIN FICHAR */}
                      <div
                        onClick={() => setManagerDailyListType("missing")}
                        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-rose-300 hover:shadow-md active:scale-[0.98]"
                      >
                        <div className="absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" />

                        <div className="relative flex h-full flex-col">
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
                              {/* Icono de Reloj / Alerta */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className="h-5 w-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <span className="text-3xl font-black tracking-tight text-slate-900">
                              {notCheckedInTodayUsers.length}
                            </span>
                          </div>

                          <div className="mt-5">
                            <h3 className="text-base font-bold text-slate-900">
                              Sin fichar
                            </h3>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-rose-500 transition-all duration-700"
                                style={{
                                  width: `${Math.min(100, (notCheckedInTodayUsers.length / (totalExpectedTodayUsers.length || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              Pendientes de iniciar jornada.
                            </p>
                          </div>

                          <div className="mt-auto pt-6">
                            <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-rose-600">
                              <span className="border-b border-rose-100 group-hover:border-rose-500 transition-colors">
                                Revisar ausencias
                              </span>
                              <span className="ml-1 transition-transform group-hover:translate-x-1">
                                →
                              </span>
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
                        <div className="absolute -top-3 -right-1 h-[4.8rem] w-[4.2rem] rounded-full bg-indigo-50/65 transition-transform duration-500 group-hover:scale-[1.8]" />

                        <div className="relative flex h-full flex-col">
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-200">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className="h-5 w-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                                />
                              </svg>
                            </div>
                            <span className="text-3xl font-black tracking-tight text-slate-900">
                              {totalExpectedTodayUsers.length}
                            </span>
                          </div>

                          <div className="mt-5">
                            <h3 className="text-base font-bold text-slate-900">
                              Plantilla esperada
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                              {exclusionSummaryText}
                            </p>
                          </div>

                          {/* SECCIÓN DE BOTONES INFERIORES (Donde estaba la cruz) */}
                          <div className="mt-auto pt-6">
                            <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-slate-600">
                              <span className="border-b border-slate-100 group-hover:border-slate-500 transition-colors">
                                Abrir detalle diario
                              </span>
                              <span className="ml-1 transition-transform group-hover:translate-x-1">
                                →
                              </span>
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
                <div
                  className="mb-12 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                  id="cuadrante-diario"
                >
                  {/* Cabecera del Cuadrante */}
                  <div className="border-b border-slate-100 p-5 lg:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-1 rounded-full bg-indigo-600" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Visualizador Temporal
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight lg:text-xl">
                          Cuadrante de fichajes
                        </h3>
                        <p className="max-w-2xl text-sm text-slate-500">
                          Distribución horaria de la actividad del equipo por
                          slots de 60 minutos.
                        </p>
                      </div>

                      {/* Navegación de Fecha Refinada */}
                      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() => adjustTrackerDate(-1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:text-indigo-600 active:scale-90"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 19l-7-7 7-7"
                            />
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
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div id= "margin" className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-50 pt-4">
                      <span className="text-[11px] font-semibold text-slate-500">Estado</span>
                      {RECORD_STATE_LEGEND_ITEMS.map(renderLegendChip)}
                      <span className="h-3.5 w-px bg-slate-200" />
                      <span className="text-[11px] font-semibold text-slate-500">Validación</span>
                      {RECORD_VALIDATION_LEGEND_ITEMS.map(renderLegendChip)}
                    </div>

{/* CONTENEDOR PRINCIPAL DE FILTROS DEL CUADRANTE */}
<div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm backdrop-blur-sm">
  <div className="flex flex-wrap items-end gap-4">
    
    {/* 1. Buscar Trabajador (El primero y expandido) */}
    <div className="min-w-[280px] flex-1">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Buscar Trabajador
      </label>
      <div className="relative">
        <Input
          type="search"
          value={managerUserSearch} 
          onChange={(e) => setManagerUserSearch(e.target.value)}
          placeholder="Ej: Juan Pérez..."
          className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm transition-all focus:border-slate-400 focus:ring-0"
        />
        {/* Icono de Lupa integrado */}
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>

    {/* 2. Filtro de Estado */}
      <div className="w-[200px] shrink-0">
            <Select
                id="trackerStatusFilter"
                label="Estado"
                value={trackerStatusFilter}
                onChange={(event) =>
                setTrackerStatusFilter(
                event.target.value as "" | DisplayWorkdayStatus,
                )
                }
               options={[
               { value: "", label: "Todos" },
               { value: "COMPLETED", label: "Cerrado" },
               { value: "OPEN", label: "Abierta" },
               { value: "ABSENT", label: "Ausente" },
              ]}
              />
      
        </div>

    {/* 3. Filtro de Validación (¡Tu lógica original insertada en el nuevo diseño!) */}
    <div className="w-[200px] shrink-0">
      <Select
        id="trackerTrustFilter"
        label="Validación"
        value={trackerTrustFilter}
        onChange={(event) =>
          setTrackerTrustFilter(
            event.target.value as "" | DisplayWorkdayTrustLevel
          )
        }
        options={[
          { value: "", label: "Todas" },
          { value: "CORRECT", label: "Correcta" },
          { value: "REVIEW", label: "Revisar" },
        ]}
      />
    </div>

  </div>
</div> 
</div>

                  {/* Rejilla Horaria con diseño de Slots */}
                  <div className="relative bg-white p-4">
                    {managerTrackerMembers.length === 0 ? (
                      <div className="flex h-32 items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/40">
                        <p className="text-sm text-slate-500">
                          No hay trabajadores que coincidan con los filtros del
                          cuadrante.
                        </p>
                      </div>
                    ) : (
                      <div
                        ref={trackerGridScrollRef}
                        className="overflow-x-auto rounded-[1.5rem] border border-slate-100"
                        style={{ position: "relative" }}
                      >
                        {/* Línea de hora actual */}
                        {trackerDate === getTodaySqlDate() && (() => {
                          const now = new Date();
                          const nowH = now.getHours();
                          const nowM = now.getMinutes();
                          if (nowH < TRACKER_HOURS[0] || nowH > TRACKER_HOURS[TRACKER_HOURS.length - 1]) return null;
                          const WORKER_COL_WIDTH = 240;
                          const HOUR_COL_WIDTH = 64;
                          const hIndex = TRACKER_HOURS.indexOf(nowH);
                          if (hIndex === -1) return null;
                          const xPx = WORKER_COL_WIDTH + hIndex * HOUR_COL_WIDTH + (nowM / 60) * HOUR_COL_WIDTH;
                          return (
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: `${xPx}px`,
                                width: "2px",
                                background: "#3b82f6",
                                zIndex: 25,
                                pointerEvents: "none",
                              }}
                            />
                          );
                        })()}
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/50">
                              <th
                                data-tracker-worker-header="true"
                                className="sticky left-0 z-30 min-w-[240px] border-b border-r border-slate-100 bg-slate-50 px-6 py-4 text-left font-black uppercase tracking-widest text-slate-400"
                              >
                                Trabajador
                              </th>
                              {TRACKER_HOURS.map((h) => {
                                const now = new Date();
                                const isCurrentHour =
                                  trackerDate === getTodaySqlDate() &&
                                  now.getHours() === h;
                                return (
                                  <th
                                    key={`h-${h}`}
                                    data-tracker-hour={h}
                                    className={`min-w-[64px] border-b border-slate-100 px-2 py-4 text-center font-bold transition-colors ${
                                      isCurrentHour
                                        ? "text-blue-500 bg-blue-50/40"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {String(h).padStart(2, "0")}:00
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {managerTrackerMembers.map((member) => {
                              const userRecords =
                                trackerDateRecordsMap.get(member.id) || [];
                              return (
                                <tr
                                  key={`q-row-${member.id}`}
                                  className="group hover:bg-slate-50/30"
                                >
                                  <td
                                    className="sticky left-0 z-20 min-w-[240px] cursor-pointer border-b border-r border-slate-100 bg-white px-6 py-4 font-bold text-slate-700 transition-colors group-hover:bg-slate-50/80"
                                    onClick={() => {
                                      const firstRecord = userRecords[0];
                                      if (firstRecord)
                                        setSelectedRecordForDetail(firstRecord);
                                    }}
                                    title={`Ver resumen de ${member.name}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300 transition-colors group-hover:bg-indigo-400" />
                                      {member.name}
                                    </div>
                                  </td>
                                  {TRACKER_HOURS.map((h) => {
                                    const matchingRecord = getHourlySlotRecord(
                                      userRecords,
                                      h,
                                    );
                                    const now = new Date();
                                    const isCurrentHour =
                                      trackerDate === getTodaySqlDate() &&
                                      now.getHours() === h;

                                    if (!matchingRecord) {
                                      return (
                                        <td
                                          key={`cell-${member.id}-${h}`}
                                          className={`border-b border-slate-100 p-1.5 ${isCurrentHour ? "bg-blue-50/20" : ""}`}
                                        >
                                          <div className="h-9 w-full rounded-lg bg-slate-50/50 opacity-20 hover:bg-slate-200 hover:opacity-60 transition-all duration-200" />
                                        </td>
                                      );
                                    }

                                    const { leftFraction, rightFraction } =
                                      getSlotProportionalOffset(
                                        matchingRecord,
                                        h,
                                      );
                                    const colorClasses =
                                      getQuadrantRecordColorClasses(
                                        matchingRecord,
                                      );
                                    const checkInTime = formatTimeOnly(
                                      matchingRecord.checkInAt,
                                    );
                                    const checkOutTime = matchingRecord.checkOutAt
                                      ? formatTimeOnly(matchingRecord.checkOutAt)
                                      : "en curso";
                                    const flags =
                                      matchingRecord.incidentFlags ?? [];
                                    return (
                                      <td
                                        key={`cell-${member.id}-${h}`}
                                        className={`border-b border-slate-100 p-1.5 ${isCurrentHour ? "bg-blue-50/20" : ""}`}
                                      >
                                        <div
                                          style={{
                                            paddingLeft: `${leftFraction * 100}%`,
                                            paddingRight: `${rightFraction * 100}%`,
                                          }}
                                        >
                                          <div
                                            onClick={() =>
                                              setSelectedRecordForDetail(
                                                matchingRecord,
                                              )
                                            }
                                            onMouseEnter={(e) =>
                                              setTrackerTooltip({
                                                x: e.clientX,
                                                y: e.clientY,
                                                member,
                                                record: matchingRecord,
                                              })
                                            }
                                            onMouseMove={(e) =>
                                              setTrackerTooltip((prev) =>
                                                prev
                                                  ? { ...prev, x: e.clientX, y: e.clientY }
                                                  : null,
                                              )
                                            }
                                            onMouseLeave={() => setTrackerTooltip(null)}
                                            className={`h-9 w-full cursor-pointer rounded-lg shadow-lg ring-1 ring-white/20 transition-all duration-200 active:scale-95 hover:brightness-110 ${colorClasses} ${
                                              leftFraction > 0
                                                ? "rounded-l-sm"
                                                : ""
                                            } ${rightFraction > 0 ? "rounded-r-sm" : ""}`}
                                          />
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
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
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                          managerReviewTab === "requests"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        Solicitudes
                        {!viewedTabs.includes("requests") &&
                          pendingRequests.length > 0 && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${managerReviewTab === "requests" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`}
                            >
                              {pendingRequests.length}
                            </span>
                          )}
                      </button>
                    ) : null}

                    {/* 2. REVISIÓN HORARIA */}
                    <button
                      type="button"
                      onClick={() => handleTabClick("incidents")}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                        managerReviewTab === "incidents"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {isCoordinatorManagerView
                        ? "Revisión horaria"
                        : "Revisión"}
                      {!viewedTabs.includes("incidents") &&
                        pendingIncidentJustifications.length > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${managerReviewTab === "incidents" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`}
                          >
                            {pendingIncidentJustifications.length}
                          </span>
                        )}
                    </button>

                    {/* 3. REGISTROS DE EQUIPO */}
                    {canViewTeamRecords ? (
                      <button
                        type="button"
                        onClick={() => handleTabClick("records")}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                          managerReviewTab === "records"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        Fichajes
                      </button>
                    ) : null}

                    {/* 4. TELETRABAJO Y PERMISOS */}
                    {canReviewExclusionRequests ? (
                      <button
                        type="button"
                        onClick={() => handleTabClick("exclusions")}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                          managerReviewTab === "exclusions"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        Permisos
                        {!viewedTabs.includes("exclusions") &&
                          pendingExclusionCount > 0 && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs transition-opacity duration-300 ${managerReviewTab === "exclusions" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`}
                            >
                              {pendingExclusionCount}
                            </span>
                          )}
                      </button>
                    ) : null}
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

{/* CONTENEDOR PRINCIPAL DE FILTROS - VISTA DETALLADA (REGISTROS) */}
<div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm backdrop-blur-sm">
  <div className="flex flex-wrap items-end gap-4">

    {/* 1. Buscador de Trabajador */}
    <div className="min-w-[280px] flex-1">
      <label htmlFor="managerUserFilter" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Trabajador
      </label>
      <div className="relative">
        <Input
          id="managerUserFilter"
          type="search"
          list="managerUserFilterSuggestions"
          value={managerUserSearch}
          placeholder="Busca por nombre o selecciona uno..."
          autoComplete="off"
          className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm transition-all focus:border-slate-400 focus:ring-0"
          onChange={(event) => {
            const nextValue = event.target.value;
            const normalizedValue = nextValue.trim().toLocaleLowerCase("es-ES");
            const exactMatch = teamMembers.find(
              (member) =>
                member.name.toLocaleLowerCase("es-ES") === normalizedValue
            );

            setManagerUserSearch(nextValue);
            setManagerUserFilter(exactMatch?.id ?? "");
          }}
        />
        {/* Lupa integrada */}
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <datalist id="managerUserFilterSuggestions">
          {teamMembers.map((member) => (
            <option key={member.id} value={member.name} />
          ))}
        </datalist>
      </div>
    </div>

    {/* 2. Filtro Fecha Desde */}
    <div className="w-[140px] shrink-0">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Desde (Fecha)
      </label>
      <input
        type="date"
        value={managerDateFrom}
        onChange={(event) => setManagerDateFrom(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-0"
      />
    </div>

    {/* 3. Filtro Fecha Hasta */}
    <div className="w-[140px] shrink-0">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Hasta (Fecha)
      </label>
      <input
        type="date"
        value={managerDateTo}
        onChange={(event) => setManagerDateTo(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-0"
      />
    </div>

    {/* 4. Filtro Hora Desde */}
    <div className="w-[120px] shrink-0">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Hora Desde
      </label>
      <input
        type="time"
        value={managerHourFrom}
        onChange={(event) => setManagerHourFrom(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-0"
      />
    </div>

    {/* 5. Filtro Hora Hasta */}
    <div className="w-[120px] shrink-0">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Hora Hasta
      </label>
      <input
        type="time"
        value={managerHourTo}
        onChange={(event) => setManagerHourTo(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-0"
      />
    </div>

    {/* 6. Botón de Limpiar Filtros (Alineado automáticamente a la derecha) */}
    <div className="ml-auto shrink-0">
      <Button
        variant="secondary"
        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95"
        onClick={() => {
          setManagerUserSearch("");
          setManagerUserFilter("");
          setManagerDateFrom("");
          setManagerDateTo("");
          setManagerHourFrom("");
          setManagerHourTo("");
        }}
      >
       
        <span>Limpiar</span>
      </Button>
    </div>

  </div>
</div>
                  </div>
                ) : null}

                {canReviewAdjustmentRequests &&
                managerReviewTab === "requests" ? (
<div className="bg-white p-6" style={tabPanelAnimationStyle}>
                    <div className="mb-4 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Revisión
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">
                        Solicitudes pendientes
                      </h3>
                      <p className="text-sm text-slate-600">
                        Los usuarios autorizados pueden revisar y resolver estas
                        solicitudes.
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      
                      {/* --- NUEVO BLOQUE DE FILTROS ESTILIZADO --- */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm backdrop-blur-sm">
                        <div className="flex flex-wrap items-end gap-4">

                          {/* 1. Trabajador (Se expande) */}
                          <div className="min-w-[240px] flex-1">
                            <label htmlFor="requestsUserFilterManager" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Trabajador
                            </label>
                            <div className="relative">
                              <Input
                                id="requestsUserFilterManager"
                                type="search"
                                list="requestsUserFilterSuggestions"
                                value={requestsUserSearch}
                                placeholder="Todos los trabajadores..."
                                autoComplete="off"
                                className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm transition-all focus:border-slate-400 focus:ring-0"
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  setRequestsUserSearch(nextValue);
                                  const exactMatch = teamMembers.find(
                                    (member) => member.name === nextValue,
                                  );
                                  setRequestsUserFilter(exactMatch?.id ?? "");
                                }}
                              />
                              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                              <datalist id="requestsUserFilterSuggestions">
                                {teamMembers.map((member) => (
                                  <option key={`requests-user-${member.id}`} value={member.name} />
                                ))}
                              </datalist>
                            </div>
                          </div>

                          {/* 2. Fecha Desde */}
                          <div className="w-[140px] shrink-0">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Desde
                            </label>
                            <input
                              type="date"
                              value={requestsDateFrom}
                              onChange={(e) => setRequestsDateFrom(e.target.value)}
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-0"
                            />
                          </div>

                          {/* 3. Fecha Hasta */}
                          <div className="w-[140px] shrink-0">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Hasta
                            </label>
                            <input
                              type="date"
                              value={requestsDateTo}
                              onChange={(e) => setRequestsDateTo(e.target.value)}
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-0"
                            />
                          </div>

                          {/* 4. Estado */}
                          <div className="w-[200px] shrink-0">
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
                          </div>

                          {/* 5. Botón Limpiar */}
                          <div className="ml-auto shrink-0">
                            <Button
                              variant="secondary"
                              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                              onClick={clearRequestFilters}
                            >
                              <span>Limpiar</span>
                            </Button>
                          </div>

                        </div>
                      </div>
                      {/* --- FIN BLOQUE DE FILTROS --- */}

                      {pendingRequestsLoading ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          Cargando solicitudes pendientes...
                        </p>
                      ) : filteredManagerRequests.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          No hay solicitudes pendientes que coincidan con los
                          filtros.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
                              <thead>
                                <tr className="sticky top-0 z-10 bg-slate-50 text-left text-[11px] uppercase tracking-[0.14em] text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                                  <th className="w-[20%] py-3 pr-4 pl-4 font-semibold">
                                    Usuario
                                  </th>
                                  <th className="w-[11%] py-3 pr-4 font-semibold">
                                    Tipo
                                  </th>
                                  <th className="w-[12%] py-3 pr-4 font-semibold">
                                    Fecha y hora
                                  </th>
                                  <th className="w-[18%] py-3 pr-4 font-semibold">
                                    Motivo
                                  </th>
                                  <th className="w-[14%] py-3 pr-4 font-semibold">
                                    Estado
                                  </th>
                                  <th className="w-[17%] py-3 pr-4 font-semibold">
                                    Comentario
                                  </th>
                                  <th className="w-[8%] py-3 pr-4 font-semibold">
                                    Acciones
                                  </th>
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-slate-100">
                                {filteredManagerRequests.map((request) => (
                                  <tr
                                    key={request.id}
                                    className="transition-colors hover:bg-slate-50/60"
                                  >
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
                                        {
                                          ADJUSTMENT_TYPE_LABELS[
                                            request.requestType
                                          ]
                                        }
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
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${ADJUSTMENT_STATUS_CLASSES[request.status]}`}
                                      >
                                        {
                                          ADJUSTMENT_STATUS_LABELS[
                                            request.status
                                          ]
                                        }
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
                                        {(request.status ===
                                          "PENDING_COORDINATOR" ||
                                          request.status ===
                                            "PENDING_ADMIN") && (
                                          <>
                                            <Button
                                              variant="secondary"
                                              className="rounded-full border-rose-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-rose-700 shadow-none hover:bg-rose-50"
                                              onClick={() =>
                                                reviewRequest(
                                                  request.id,
                                                  "REJECTED",
                                                )
                                              }
                                              disabled={
                                                reviewSubmittingId ===
                                                  request.id ||
                                                !isFunctionalAdmin
                                              }
                                            >
                                              Rechazar
                                            </Button>

                                            <Button
                                              className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700"
                                              onClick={() =>
                                                reviewRequest(
                                                  request.id,
                                                  "APPROVED",
                                                )
                                              }
                                              disabled={
                                                reviewSubmittingId ===
                                                  request.id ||
                                                !isFunctionalAdmin
                                              }
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
                        {isCoordinatorManagerView
                          ? "Registros horarios por validar"
                          : "Control de anomalías y justificaciones"}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {isCoordinatorManagerView
                          ? "Revisa excesos o faltas de horas de los trabajadores de tu ámbito."
                          : "Gestiona tanto las justificaciones enviadas por el equipo como los fichajes con anomalías detectadas automáticamente."}
                      </p>
                    </div>

                    <div className="space-y-8">
{isCoordinatorManagerView ? (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm backdrop-blur-sm">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Calendario
        </p>
        <h4 className="text-sm font-semibold text-slate-900">
          Selecciona un día para revisar histórico
        </h4>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={() =>
            setTrackerCalendarMonth((current) => shiftMonthValue(current, -1))
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Mes anterior"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="min-w-[120px] text-center text-sm font-semibold capitalize text-slate-700">
          {formatMonthLabel(trackerCalendarMonth)}
        </span>
        <button
          type="button"
          onClick={() =>
            setTrackerCalendarMonth((current) => shiftMonthValue(current, 1))
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Mes siguiente"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <div className="grid grid-cols-7 gap-2 text-center">
      {CALENDAR_WEEKDAY_LABELS.map((label, index) => (
        <div
          key={`tracker-calendar-weekday-${label}`}
          className={`text-[11px] font-bold uppercase tracking-wider ${index >= 5 ? "text-rose-400" : "text-slate-400"}`}
        >
          {label}
        </div>
      ))}

      {trackerCalendarWeeks.flat().map((cell, index) => {
        if (!cell.workDate || !cell.dayNumber) {
          return (
            <div
              key={`tracker-calendar-empty-${index}`}
              className="h-12 rounded-xl border border-transparent"
            />
          );
        }

        const incidentCount =
          trackerCalendarIncidentCounts.get(cell.workDate) ?? 0;
        const isSelected = cell.workDate === trackerDate;

        return (
          <button
            key={cell.workDate}
            type="button"
            onClick={() => setTrackerDate(cell.workDate!)}
            className={`flex h-12 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
              isSelected
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : incidentCount > 0
                  ? "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            } ${cell.isWeekend ? "text-rose-500" : ""} ${cell.isToday && !isSelected ? "ring-2 ring-sky-100" : ""}`}
          >
            <span>{cell.dayNumber}</span>
            <span
              className={`mt-1 h-1.5 w-1.5 rounded-full ${
                incidentCount > 0
                  ? isSelected
                    ? "bg-white"
                    : "bg-orange-500"
                  : isSelected
                    ? "bg-white/60"
                    : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
      <span className="font-medium">
        Día seleccionado: {formatShortDate(trackerDate)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-orange-500" />
        Días con registros por validar
      </span>
    </div>
  </div>
) : null}
{/* CONTENEDOR PRINCIPAL DE FILTROS - REVISIÓN */}
<div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm backdrop-blur-sm">
  <div className="flex flex-wrap items-end gap-4">

    {/* 1. Trabajador (Ahora va el primero y se expande para dar comodidad al escribir) */}
    <div className="min-w-[280px] flex-1">
      <Input
        id="incidentsUserFilterManager"
        label="Trabajador"
        type="search"
        list="incidentUserFilterSuggestions"
        value={incidentUserSearch}
        placeholder="Todos los trabajadores..."
        className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm shadow-sm transition-all focus:border-slate-400 focus:ring-0"
        onChange={(event) => {
          const nextValue = event.target.value;
          setIncidentUserSearch(nextValue);
          const exactMatch = teamMembers.find(
            (member) => member.name === nextValue,
          );
          setIncidentUserFilter(exactMatch?.id ?? "");
        }}
      />
    </div>
    
    {/* Lista de sugerencias para el autocompletado (Mantiene tu lógica) */}
    <datalist id="incidentUserFilterSuggestions">
      {teamMembers.map((member) => (
        <option key={`incident-user-${member.id}`} value={member.name} />
      ))}
    </datalist>

    {/* 2. Estado de la Justificación */}
    <div className="w-[240px] shrink-0">
        <Select
          id="incidentsStatusFilterManager"
          label="Estado Justificación"
          value={incidentStatusFilter}
          onChange={(e) => setIncidentStatusFilter(e.target.value)}
          options={[
            { value: "", label: "Todos los estados" },
            {
              value: PENDING_ADMINISTRATION_FILTER_VALUE,
              label: "Pendiente Administración",
            },
            { value: "APPROVED", label: "Aprobada" },
            { value: "REJECTED", label: "Rechazada" },
          ]}
      />
    </div>

    {/* 3. Botón de Limpiar Filtros (Alineado automáticamente a la derecha) */}
    <div className="ml-auto shrink-0">
      <Button
        variant="secondary"
        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
        onClick={clearIncidentFilters}
      >
        <span>Limpiar Filtros</span>
      </Button>
    </div>

  </div>
</div>

                      {/* Sección 1: Justificaciones Pendientes */}
                      {!isCoordinatorManagerView ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                              Justificaciones por revisar (
                              {filteredManagerIncidents.length})
                            </h4>
                          </div>

                          {pendingIncidentJustificationsLoading ? (
                            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                              <p className="mt-2 text-xs text-slate-500">
                                Cargando solicitudes...
                              </p>
                            </div>
                          ) : filteredManagerIncidents.length === 0 ? (
                            <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                              <p className="text-sm text-slate-500">
                                No hay justificaciones con los filtros actuales.
                              </p>
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
                                    {filteredManagerIncidents.map(
                                      (justification) => (
                                        <tr
                                          key={justification.id}
                                          className="hover:bg-slate-50/50 transition-colors"
                                        >
                                          <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-900">
                                              {getDisplayUserName(
                                                justification.userId,
                                                justification.userName,
                                              )}
                                            </p>
                                          </td>
                                          <td className="px-4 py-4">
                                            <div className="space-y-1">
                                              <p className="font-medium text-slate-900">
                                                {justification.workDate
                                                  ? formatShortDate(
                                                      justification.workDate,
                                                    )
                                                  : "Sin fecha"}
                                              </p>
                                              <p className="text-xs text-slate-600">
                                                {getRecordLine({
                                                  checkInAt:
                                                    justification.checkInAt ??
                                                    "",
                                                  checkOutAt:
                                                    justification.checkOutAt ??
                                                    null,
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
                                            <span
                                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${INCIDENT_JUSTIFICATION_STATUS_CLASSES[justification.status]}`}
                                            >
                                              {
                                                INCIDENT_JUSTIFICATION_STATUS_LABELS[
                                                  justification.status
                                                ]
                                              }
                                            </span>
                                          </td>
                                          <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                              {justification.status ===
                                                "PENDING_COORDINATOR" ||
                                              justification.status ===
                                                "PENDING_ADMIN" ? (
                                                <>
                                                  <button
                                                    onClick={() =>
                                                      reviewIncidentJustification(
                                                        justification.id,
                                                        "REJECTED",
                                                      )
                                                    }
                                                    disabled={
                                                      reviewSubmittingId ===
                                                        justification.id ||
                                                      !canReviewIncidentRequests
                                                    }
                                                    className="rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                                  >
                                                    Rechazar
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      reviewIncidentJustification(
                                                        justification.id,
                                                        "APPROVED",
                                                      )
                                                    }
                                                    disabled={
                                                      reviewSubmittingId ===
                                                        justification.id ||
                                                      !canReviewIncidentRequests
                                                    }
                                                    className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                  >
                                                    Aprobar
                                                  </button>
                                                </>
                                              ) : null}
                                            </div>
                                          </td>
                                        </tr>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Sección 2: Anomalías Detectadas (Sin justificar necesariamente) */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            {isCoordinatorManagerView
                              ? "Registros horarios por validar ("
                              : "Fichajes por revisar ("}
                            {filteredManagerIncidentRecords.length})
                          </h4>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                          Usa los campos <span className="font-semibold text-slate-800">Desde</span> y{" "}
                          <span className="font-semibold text-slate-800">Hasta</span> para revisar un día concreto o un periodo completo.
                        </div>

                        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-6">
                          <Input
                            id="incidentRecordUserFilter"
                            label="Trabajador"
                            type="search"
                            list="incidentRecordUserFilterSuggestions"
                            value={incidentRecordUserSearch}
                            placeholder="Todos"
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setIncidentRecordUserSearch(nextValue);
                              const exactMatch = teamMembers.find(
                                (member) => member.name === nextValue,
                              );
                              setIncidentRecordUserFilter(exactMatch?.id ?? "");
                            }}
                          />
                          <datalist id="incidentRecordUserFilterSuggestions">
                            {teamMembers.map((member) => (
                              <option key={`incident-record-user-${member.id}`} value={member.name} />
                            ))}
                          </datalist>
                          <Input
                            label="Desde"
                            type="date"
                            value={incidentRecordDateFrom}
                            onChange={(event) =>
                              setIncidentRecordDateFrom(event.target.value)
                            }
                          />
                          <Input
                            label="Hasta"
                            type="date"
                            value={incidentRecordDateTo}
                            onChange={(event) =>
                              setIncidentRecordDateTo(event.target.value)
                            }
                          />
                          <Select
                            id="incidentRecordTrustFilter"
                            label="Validación"
                            value={incidentRecordTrustFilter}
                            onChange={(event) =>
                              setIncidentRecordTrustFilter(
                                event.target.value as "" | DisplayWorkdayTrustLevel,
                              )
                            }
                            options={[
                              { value: "", label: "Todas" },
                              { value: "CORRECT", label: "Correcta" },
                              { value: "REVIEW", label: "Revisar" },
                            ]}
                          />
                          <Select
                            id="incidentRecordStatusFilter"
                            label="Estado"
                            value={incidentRecordStatusFilter}
                            onChange={(e) =>
                              setIncidentRecordStatusFilter(
                                e.target.value as "" | WorkdayStatus,
                              )
                            }
                            options={[
                              { value: "", label: "Todos" },
                              { value: "INCIDENT", label: "Cerrado" },
                              { value: "INCOMPLETE", label: "Ausente" },
                            ]}
                          />
                          <div className="flex items-end">
                            <Button
                              variant="secondary"
                              className="bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2 shadow-sm transition-all"
                              onClick={clearIncidentRecordFilters}
                            >
                              Limpiar
                            </Button>
                          </div>
                        </div>

                        {filteredManagerIncidentRecords.length === 0 ? (
                          <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                            <p className="text-sm text-slate-500">
                              No hay fichajes por revisar que coincidan con
                              los filtros.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="hidden grid-cols-[minmax(0,1.5fr)_110px_120px_120px_minmax(0,2fr)] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:grid">
                              <span>Trabajador</span>
                              <span>Fecha</span>
                              <span>Estado</span>
                              <span>Validación</span>
                              <span>Detalle</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {filteredManagerIncidentRecords.map((record) => (
                                <button
                                  key={`anomaly-tab-${record.id}`}
                                  type="button"
                                  onClick={() =>
                                    openManagerRecordDetail(record)
                                  }
                                  className="group grid w-full gap-2 px-4 py-3 text-left transition hover:bg-orange-50/40 md:grid-cols-[minmax(0,1.5fr)_110px_120px_120px_minmax(0,2fr)] md:items-center md:gap-3"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {getDisplayUserName(
                                        record.userId,
                                        record.userName,
                                      )}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500 md:hidden">
                                      {formatShortDate(record.workDate)}
                                    </p>
                                  </div>
                                  <span className="hidden text-sm text-slate-600 md:block">
                                    {formatShortDate(record.workDate)}
                                  </span>
                                  <div>
                                    <span
                                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_CLASSES[getDisplayRecordStatus(record)]}`}
                                    >
                                      {
                                        STATUS_LABELS[
                                          getDisplayRecordStatus(record)
                                        ]
                                      }
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
                                    {isCoordinatorManagerView ? (
                                      <p className="text-sm text-slate-700">
                                        {getCoordinatorIncidentDetail(record)}
                                      </p>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {getStatusDetailItems(record).map((item) => (
                                          <span
                                            key={`${record.id}-list-detail-${item}`}
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-4 ${getStatusDetailItemClass(record)}`}
                                          >
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div className="mt-2 flex items-center gap-1">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 transition-colors group-hover:text-orange-700">
                                        Abrir detalle
                                      </span>
                                      <span className="text-sm text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-orange-400">
                                        →
                                      </span>
                                    </div>
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

                {canReviewExclusionRequests && managerReviewTab === "exclusions" ? (
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
                      
                      {/* --- BLOQUE DE FILTROS HORIZONTALES PREMIUM --- */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm backdrop-blur-sm">
                        <div className="flex flex-wrap items-end gap-4">

                          {/* 1. Trabajador (Se expande fluidamente) */}
                          <div className="min-w-[240px] flex-1">
                            <label htmlFor="exclUserFilterManager" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Trabajador
                            </label>
                            <div className="relative">
                              <Input
                                id="exclUserFilterManager"
                                type="search"
                                list="requestsUserFilterSuggestions"
                                value={requestsUserSearch}
                                placeholder="Todos los trabajadores..."
                                autoComplete="off"
                                className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm transition-all focus:border-slate-400 focus:ring-0"
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  setRequestsUserSearch(nextValue);
                                  const exactMatch = teamMembers.find(
                                    (member) => member.name === nextValue,
                                  );
                                  setRequestsUserFilter(exactMatch?.id ?? "");
                                }}
                              />
                              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                              <datalist id="requestsUserFilterSuggestions">
                                {teamMembers.map((member) => (
                                  <option key={`requests-user-${member.id}`} value={member.name} />
                                ))}
                              </datalist>
                            </div>
                          </div>

                          {/* 2. Fecha Desde */}
                          <div className="w-[140px] shrink-0">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Desde
                            </label>
                            <input
                              type="date"
                              value={requestsDateFrom}
                              onChange={(e) => setRequestsDateFrom(e.target.value)}
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-0"
                            />
                          </div>

                          {/* 3. Fecha Hasta */}
                          <div className="w-[140px] shrink-0">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Hasta
                            </label>
                            <input
                              type="date"
                              value={requestsDateTo}
                              onChange={(e) => setRequestsDateTo(e.target.value)}
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition-all focus:border-slate-400 focus:outline-none focus:ring-0"
                            />
                          </div>

                          {/* 4. Estado */}
                          <div className="w-[200px] shrink-0">
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
                          </div>

                          {/* 5. Botón Limpiar */}
                          <div className="ml-auto shrink-0">
                            <Button
                              variant="secondary"
                              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                              onClick={clearRequestFilters}
                            >
                              <span>Limpiar</span>
                            </Button>
                          </div>

                        </div>
                      </div>
                      {/* --- FIN BLOQUE DE FILTROS --- */}

                      {pendingExclusionRequestsLoading ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          Cargando solicitudes...
                        </p>
                      ) : filteredManagerExclusions.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          No hay solicitudes que coincidan con los filtros.
                        </p>
                      ) : (
                        /* Contenedor de tabla idéntico para homogeneidad visual total */
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
                              <thead>
                                <tr className="sticky top-0 z-10 bg-slate-50 text-left text-[11px] uppercase tracking-[0.14em] text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                                  <th className="w-[20%] py-3 pr-4 pl-4 font-semibold">
                                    Usuario
                                  </th>
                                  <th className="w-[11%] py-3 pr-4 font-semibold">
                                    Tipo
                                  </th>
                                  <th className="w-[12%] py-3 pr-4 font-semibold">
                                    Fecha
                                  </th>
                                  <th className="w-[14%] py-3 pr-4 font-semibold">
                                    Estado
                                  </th>
                                  <th className="w-[18%] py-3 pr-4 font-semibold">
                                    Motivo
                                  </th>
                                  <th className="w-[17%] py-3 pr-4 font-semibold">
                                    Comentario
                                  </th>
                                  <th className="w-[8%] py-3 pr-4 font-semibold">
                                    Acciones
                                  </th>
                                </tr>
                              </thead>
                              
                              <tbody className="divide-y divide-slate-100">
                                {filteredManagerExclusions.map((request) => (
                                  <tr
                                    key={`pending-exclusion-${request.kind}-${request.id}`}
                                    className="transition-colors hover:bg-slate-50/60"
                                  >
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
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                          request.kind === "REMOTE_WORK"
                                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                            : "bg-cyan-50 text-cyan-700 border border-cyan-100"
                                        }`}
                                      >
                                        {request.kind === "REMOTE_WORK"
                                          ? "Teletrabajo"
                                          : "Permiso"}
                                      </span>
                                    </td>
                                    
                                    <td className="py-4 pr-4 align-middle font-medium leading-6 text-slate-600">
                                      {formatShortDate(request.requestDate)}
                                    </td>
                                    
                                    <td className="py-4 pr-4 align-middle">
                                      <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${EXCLUSION_REQUEST_STATUS_CLASSES[request.status]}`}
                                      >
                                        {
                                          EXCLUSION_REQUEST_STATUS_LABELS[
                                            request.status
                                          ]
                                        }
                                      </span>
                                    </td>
                                    
                                    <td className="py-4 pr-4 align-middle text-slate-700">
                                      <p className="max-w-[280px] whitespace-normal leading-6">
                                        {request.reason}
                                      </p>
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
                                        <Button
                                          variant="secondary"
                                          className="rounded-full border-rose-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-rose-700 shadow-none hover:bg-rose-50"
                                          onClick={() =>
                                            reviewExclusionRequest(
                                              request,
                                              "REJECTED",
                                            )
                                          }
                                          disabled={
                                            reviewSubmittingId === request.id ||
                                            (request.status === "PENDING_ADMIN" &&
                                              !isFunctionalAdmin)
                                          }
                                        >
                                          Rechazar
                                        </Button>
                                        
                                        <Button
                                          className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700"
                                          onClick={() =>
                                            reviewExclusionRequest(
                                              request,
                                              "APPROVED",
                                            )
                                          }
                                          disabled={
                                            reviewSubmittingId === request.id ||
                                            (request.status === "PENDING_ADMIN" &&
                                              !isFunctionalAdmin)
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
                    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <span className="text-[11px] font-medium text-slate-400">Estado</span>
                      {RECORD_STATE_LEGEND_ITEMS.map(renderLegendChip)}
                    </div>

                    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-[11px] font-medium text-slate-400">Validación</span>
                        {RECORD_VALIDATION_LEGEND_ITEMS.map(renderLegendChip)}
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-slate-600">
                        La validación resume si el fichaje es correcto, si
                        conviene revisarlo o si presenta una anomalía técnica o
                        de ubicación.
                      </p>
                    </div>

                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Equipo
                        </p>
                        <h3 className="text-base font-semibold text-slate-900">
                          Fichajes del equipo
                        </h3>
                        <p className="text-sm text-slate-600">
                          Consulta todos los fichajes registrados en el conjunto
                          filtrado actual.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="flex items-center gap-2"
                          onClick={exportToExcel}
                          disabled={
                            managerVisibleRecords.length === 0 ||
                            !managerUserFilter
                          }
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Descargar Excel
                        </Button>
                      </div>
                    </div>
                    {!managerUserFilter ? (
                      <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <svg
                          className="h-4 w-4 shrink-0 text-amber-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-xs font-medium text-amber-700">
                          Selecciona un trabajador en el filtro para exportar su
                          informe.
                        </p>
                      </div>
                    ) : null}

                    {loading ? (
                      <p className="text-sm text-slate-500">
                        Cargando registros del equipo...
                      </p>
                    ) : managerVisibleRecords.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No hay registros que coincidan con los filtros
                        aplicados.
                      </p>
                    ) : (
                      <div className="max-h-[600px] overflow-auto rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead>
                            <tr className="sticky top-0 z-10 bg-slate-50 text-left text-slate-500 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                              <th className="py-2.5 pr-4 pl-5 font-semibold">
                                Trabajador
                              </th>
                              <th className="py-2.5 pr-4 font-semibold">
                                Fecha
                              </th>
                              <th className="py-2.5 pr-4 font-semibold">
                                Entrada
                              </th>
                              <th className="py-2.5 pr-4 font-semibold">
                                Salida
                              </th>
                              <th className="py-2.5 pr-4 font-semibold">
                                Horas
                              </th>
                              <th className="py-2.5 pr-4 font-semibold">
                                Estado
                              </th>
                              <th className="py-2.5 pr-4 font-semibold">
                                Validación
                              </th>
                              <th className="py-2.5 pr-4 font-semibold">
                                Detalle
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {managerVisibleRecords.map((record) => (
                              <tr key={`manager-record-${record.id}`}>
                                <td className="py-4 pr-4 pl-5 text-slate-700">
                                  {getDisplayUserName(
                                    record.userId,
                                    record.userName,
                                  )}
                                </td>
                                <td className="py-4 pr-4 text-slate-700">
                                  {formatShortDate(record.workDate)}
                                </td>
                                <td className="py-4 pr-4 text-slate-700">
                                  {formatTimeOnly(record.checkInAt)}
                                </td>
                                <td className="py-4 pr-4 text-slate-700">
                                  {formatTimeOnly(record.checkOutAt)}
                                </td>
                                <td className="py-4 pr-4 text-slate-700">
                                  {formatHoursFromMinutes(record.workedMinutes)}
                                </td>
                                <td className="py-4 pr-4">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_CLASSES[getDisplayRecordStatus(record)]}`}
                                  >
                                    {
                                      STATUS_LABELS[
                                        getDisplayRecordStatus(record)
                                      ]
                                    }
                                  </span>
                                </td>
                                <td
                                  className="py-4 pr-4"
                                  title={getTrustTooltip(record)}
                                >
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${TRUST_LEVEL_CLASSES[getDisplayTrustLevel(record)]}`}
                                  >
                                    {getDisplayTrustLabel(record)}
                                  </span>
                                </td>
                                <td className="py-4 pr-4">
                                  <div className="space-y-4">
                                    {isCoordinatorManagerView ? (
                                      <p>{getCoordinatorIncidentDetail(record)}</p>
                                    ) : shouldRenderStatusDetailItems(record) ? (
                                      <div className="flex flex-wrap gap-2">
                                        {getStatusDetailItems(record).map((item) => (
                                          <span
                                            key={`${record.id}-table-detail-${item}`}
                                            className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold leading-4 ${getStatusDetailItemClass(record)}`}
                                          >
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        <span
                                          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold leading-4 ${
                                            record.status === "OPEN"
                                              ? "border-amber-500 bg-transparent text-amber-700"
                                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                          }`}
                                        >
                                          {getStatusDetail(record)}
                                        </span>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                                      onClick={() =>
                                        setSelectedRecordForDetail(record)
                                      }
                                    >
                                      <span>
                                        {isPendingAdminValidation(record)
                                          ? "Abrir y validar"
                                          : "Abrir detalle"}
                                      </span>
                                      <span className="transition-transform group-hover:translate-x-0.5">
                                        →
                                      </span>
                                    </button>
                                  </div>
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
      </section>
      {openWorkdayWarning ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/45 px-4">
          <div className="relative w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold leading-none text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              onClick={postponeOpenWorkdayWarning}
              aria-label="Recordármelo después"
            >
              ×
            </button>

            <div className="flex items-start gap-4 pr-10">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ${
                  openWorkdayWarning.level === "critical"
                    ? "bg-rose-50 text-rose-600 ring-rose-100"
                    : "bg-amber-50 text-amber-600 ring-amber-100"
                }`}
              >
                <i
                  className={`ti ${
                    openWorkdayWarning.level === "critical"
                      ? "ti-alert-triangle"
                      : "ti-clock-exclamation"
                  } text-[24px]`}
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    openWorkdayWarning.level === "critical"
                      ? "text-rose-600"
                      : "text-amber-600"
                  }`}
                >
                  Jornada abierta
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  {openWorkdayWarning.level === "critical"
                    ? "Tu jornada lleva abierta demasiado tiempo"
                    : "Tu jornada sigue abierta"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {openWorkdayWarning.level === "critical"
                    ? "Esta jornada lleva abierta desde hace más de 24 horas. Revisa si olvidaste fichar la salida."
                    : "Tu jornada lleva abierta más de 8 horas y 15 minutos. Si ya has terminado, puedes fichar la salida ahora."}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Entrada:</span>{" "}
                {formatShortDate(openWorkdayWarning.record.workDate)} ·{" "}
                {formatTimeOnly(openWorkdayWarning.record.checkInAt)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tiempo abierta:{" "}
                <span className="font-semibold text-slate-700">
                  {formatHoursFromMinutes(openWorkdayWarning.minutesOpen)}
                </span>
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                className={POPUP_NEUTRAL_BUTTON_CLASS}
                onClick={postponeOpenWorkdayWarning}
                disabled={submitting}
              >
                Recordármelo después
              </Button>
              <Button
                className={POPUP_PRIMARY_BUTTON_CLASS}
                onClick={closeOpenWorkdayFromWarning}
                disabled={submitting}
              >
                Fichar salida
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white px-7 py-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div
                className={`relative mb-5 h-16 w-16 shrink-0 rounded-full ${
                  toast.tone === "success"
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
                    className="absolute inset-0 m-auto block h-6 w-6"
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
                    strokeWidth={2.35}
                    className="absolute inset-0 m-auto block h-7 w-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.67 18h16.66a1 1 0 00.88-1.14l-7.5-13a1 1 0 00-1.74 0z"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                {toast.tone === "success"
                  ? "Operación completada"
                  : "Se produjo un error"}
              </h3>
              <p className="mt-2 max-w-[24rem] text-sm leading-6 text-slate-600">
                {toast.message}
              </p>
              <div className="mt-6">
                <Button
                  className={POPUP_PRIMARY_BUTTON_CLASS}
                  onClick={() => setToast(null)}
                >
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
                  Jornadas del{" "}
                  {formatDateTime(`${selectedOverflowDate} 00:00:00`).slice(
                    0,
                    10,
                  )}
                </h3>
                <p className="text-sm text-slate-600">
                  Aquí puedes ver todos los fichajes registrados en ese día.
                </p>
              </div>
              <Button
                variant="secondary"
                className={POPUP_NEUTRAL_BUTTON_CLASS}
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
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CALENDAR_STATUS_BADGE_CLASSES[getDisplayRecordStatus(record)]}`}
                    >
                      {STATUS_LABELS[getDisplayRecordStatus(record)]}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-medium text-slate-900">
                        Entrada:
                      </span>{" "}
                      {formatDateTime(record.checkInAt)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">
                        Salida:
                      </span>{" "}
                      {formatDateTime(record.checkOutAt)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Horas:</span>{" "}
                      {formatHoursFromMinutes(record.workedMinutes)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">
                        Detalle:
                      </span>{" "}
                      {isCoordinatorManagerView
                        ? getCoordinatorIncidentDetail(record)
                        : getStatusDetail(record)}
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
  {/* Cabecera corregida */}
  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
    <div className="space-y-0.5">
      <p className="text-sm font-semibold text-slate-900">
        {managerDailyListType === "checked-in"
          ? "Fichados en fecha seleccionada"
          : managerDailyListType === "missing"
            ? "No fichados en fecha seleccionada"
            : "Excluidos (Vacaciones/Permisos)"}
      </p>
      <p className="text-xs font-medium text-slate-400">
        {formatShortDate(trackerDate)}
      </p>
    </div>
    
    {/* Botón Cerrar con diseño de botón real y definido */}
    <Button
      variant="secondary"
      className={POPUP_NEUTRAL_BUTTON_CLASS}
      onClick={() => setManagerDailyListType(null)}
    >
      Cerrar
    </Button>
  </div>

  {/* Contenido de la lista (Totalmente limpio) */}
  <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
    {managerDailyListUsers.length === 0 ? (
      <p className="text-sm text-slate-500 text-center py-4">
        No hay usuarios en esta lista para la fecha seleccionada.
      </p>
    ) : (
      <ul className="space-y-2">
        {managerDailyListUsers.map((user) => (
          <li
            key={`manager-daily-${managerDailyListType}-${user.id}`}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-all hover:border-slate-200 hover:bg-slate-50/50"
          >
            {/* Avatar del trabajador */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 font-bold text-xs border border-slate-100 uppercase">
              {user.name ? user.name.charAt(0) : "?"}
            </div>
            
            {/* Nombre del trabajador */}
            <span className="text-sm font-medium text-slate-800">
              {user.name}
            </span>
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
                className={POPUP_NEUTRAL_BUTTON_CLASS}
                onClick={() => setShowRemoteWorkModal(false)}
              >
                Cerrar
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
              {remoteWorkTodayUsers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay usuarios autorizados en teletrabajo para la fecha
                  seleccionada.
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
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              hasCheckedIn
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {hasCheckedIn
                              ? "Ha fichado"
                              : "Pendiente de fichar"}
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
  {/* Cabecera del Modal con Botón Corregido */}
  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Revisión actual
      </p>
      <p className="mt-0.5 text-base font-semibold text-slate-900 tracking-tight">
        Fichajes por revisar
      </p>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        {incidentRecordDateFrom || incidentRecordDateTo ? (
          <span>
            Rango:{" "}
            <span className="font-semibold text-slate-700">
              {incidentRecordDateFrom ? formatShortDate(incidentRecordDateFrom) : "sin inicio"}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-700">
              {incidentRecordDateTo ? formatShortDate(incidentRecordDateTo) : "sin fin"}
            </span>
          </span>
        ) : (
          <span>Mostrando todos los registros que coinciden con los filtros actuales.</span>
        )}
      </div>
      
      {/* Contenedor de Badges */}
      <div className="mt-2 flex flex-wrap gap-2">
        {modalManagerIncidentRecords.filter((r) => r.status === "INCIDENT").length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {modalManagerIncidentRecords.filter((r) => r.status === "INCIDENT").length} por revisar
          </span>
        )}
        
        {modalManagerIncidentRecords.filter((r) => r.status === "INCOMPLETE").length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            {modalManagerIncidentRecords.filter((r) => r.status === "INCOMPLETE").length} ausente
            {modalManagerIncidentRecords.filter((r) => r.status === "INCOMPLETE").length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>

    {/* El botón Cerrar unificado y pulido */}
    <Button
      variant="secondary"
      className={`${POPUP_NEUTRAL_BUTTON_CLASS} shrink-0`}
      onClick={() => setShowManagerIncidentsModal(false)}
    >
      Cerrar
    </Button>
  </div>

  {/* Cuerpo de Registros */}
  <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Día
          </span>
          <span className="truncate text-xs font-semibold text-slate-700">
            {reviewModalSelectedDate
              ? formatShortDate(reviewModalSelectedDate)
              : "Todos los días"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {reviewModalSelectedDate ? (
            <button
              type="button"
              onClick={() => setReviewModalSelectedDate(null)}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Ver todos
            </button>
          ) : null}
          <div className="flex items-center gap-1 rounded-full bg-slate-50 px-1.5 py-1 ring-1 ring-inset ring-slate-200">
            <button
              type="button"
              onClick={() =>
                setReviewModalMonth((current) =>
                  shiftMonthValue(current, -1),
                )
              }
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
              aria-label="Mes anterior"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="min-w-[104px] text-center text-xs font-bold capitalize text-slate-700">
              {formatMonthLabel(reviewModalMonth)}
            </span>
            <button
              type="button"
              onClick={() =>
                setReviewModalMonth((current) =>
                  shiftMonthValue(current, 1),
                )
              }
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
              aria-label="Mes siguiente"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {CALENDAR_WEEKDAY_LABELS.map((label, index) => (
          <div
            key={`review-modal-weekday-${label}`}
            className={`text-[9px] font-bold uppercase tracking-wider ${index >= 5 ? "text-rose-400" : "text-slate-400"}`}
          >
            {label}
          </div>
        ))}
        {reviewModalCalendarWeeks.flat().map((cell, index) => {
          if (!cell.workDate || !cell.dayNumber) {
            return (
              <div
                key={`review-modal-empty-${index}`}
                className="h-7 rounded-lg"
              />
            );
          }

          const dayCount = reviewModalRecordCounts.get(cell.workDate) ?? 0;
          const isSelected = cell.workDate === reviewModalSelectedDate;

          return (
            <button
              key={`review-modal-day-${cell.workDate}`}
              type="button"
              onClick={() =>
                setReviewModalSelectedDate((current) =>
                  current === cell.workDate ? null : cell.workDate,
                )
              }
              className={`flex h-7 flex-col items-center justify-center rounded-lg text-[11px] font-semibold transition ${
                isSelected
                  ? "bg-slate-900 text-white shadow-sm"
                  : dayCount > 0
                    ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 hover:bg-orange-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              } ${cell.isWeekend ? "text-rose-500" : ""} ${cell.isToday && !isSelected ? "ring-2 ring-sky-100" : ""}`}
            >
              <span>{cell.dayNumber}</span>
              <span
                className={`mt-0.5 h-1 w-1 rounded-full ${
                  dayCount > 0
                    ? isSelected
                      ? "bg-white"
                      : "bg-orange-500"
                    : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>

    {modalManagerIncidentRecords.length === 0 ? (
      <p className="text-sm text-slate-500 text-center py-4">
        No hay registros por validar en el conjunto filtrado actualmente.
      </p>
    ) : (
      <div className="space-y-2">
        {modalManagerIncidentRecords.map((record) => (
          <div
            key={`manager-incident-${record.id}`}
            className={`rounded-xl border px-4 py-3 shadow-sm transition-all ${
              record.status === "INCOMPLETE" 
                ? "border-slate-200 bg-white hover:border-slate-300" 
                : "border-rose-100 bg-white hover:border-rose-200"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {getDisplayUserName(record.userId, record.userName)}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                  record.status === "INCOMPLETE" 
                    ? "border-slate-200 text-slate-600 bg-slate-50/50" 
                    : "border-rose-200 text-rose-700 bg-rose-50/50"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${record.status === "INCOMPLETE" ? "bg-slate-400" : "bg-rose-500"}`} />
                {STATUS_LABELS[getDisplayRecordStatus(record)]}
              </span>
            </div>
            
            <p className="mt-1.5 text-sm text-slate-500">
              {getRecordLine(record)}
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-600">
              {isCoordinatorManagerView
                ? getCoordinatorIncidentDetail(record)
                : getStatusDetail(record)}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>

  {/* Pie de página informativo */}
  <div className="flex items-center gap-2.5 border-t border-slate-100 px-5 py-3.5 bg-slate-50/30 rounded-b-2xl">
    <svg
      className="h-4 w-4 shrink-0 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="text-xs text-slate-400 leading-normal">
      Las justificaciones enviadas por los trabajadores aparecerán en{" "}
      <span className="font-semibold text-slate-500">Revisión</span> para su revisión.
    </p>
  </div>
</div>
        </div>
      ) : null}
      {selectedDetailDate && selectedDetailRecords.length > 0 ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
<div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
  {/* Cabecera unificada */}
  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
    <p className="text-sm font-semibold text-slate-900 tracking-tight">
      Detalle de{" "}
      <span className="text-indigo-600 font-bold">
        {selectedDetailUserId
          ? getDisplayUserName(
              selectedDetailUserId,
              selectedDetailRecords[0]?.userName,
            )
          : ""}
      </span>{" "}
      el {formatDateTime(`${selectedDetailDate} 00:00:00`).slice(0, 10)}
    </p>
    
    {/* Botón Cerrar unificado y pulido */}
    <Button
      variant="secondary"
      className={`${POPUP_NEUTRAL_BUTTON_CLASS} shrink-0`}
      onClick={() => {
        setSelectedDetailDate(null);
        setSelectedDetailUserId(null);
      }}
    >
      Cerrar
    </Button>
  </div>

  {/* Contenido del Detalle */}
  <div className="max-h-[65vh] space-y-4 overflow-y-auto px-5 py-4">
    {selectedDetailRecords.map((record) => (
      <div key={`detail-${record.id}`} className="p-0.5">
        {renderRecordDetailContent(record)}
      </div>
    ))}

    {/* Tarjeta de Total Trabajado Estilizada */}
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 flex items-center justify-between shadow-inner">
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Total trabajado del día
        </p>
        <p className="text-xl font-bold text-slate-900 tracking-tight">
          {formatHoursFromMinutes(selectedDetailWorkedMinutes)}
        </p>
      </div>
      
      {/* Icono de reloj sutil decorativo */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className="w-5 h-5 text-slate-400"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
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
                  Justificar anomalía
                </h3>
                <p className="text-sm text-slate-600">
                  Explica el motivo para que coordinación y administración
                  puedan revisarlo.
                </p>
              </div>
              <Button
                variant="secondary"
                className={POPUP_NEUTRAL_BUTTON_CLASS}
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
                  className={POPUP_NEUTRAL_BUTTON_CLASS}
                  onClick={() => {
                    setSelectedIncidentRecordId(null);
                    setIncidentJustificationReason("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className={POPUP_PRIMARY_BUTTON_CLASS}
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
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  Ocultar respuesta
                </h3>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Esta acción quitará de tu vista la respuesta administrativa
                  de este registro.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Registro
                  </p>
                  <p className="font-medium text-slate-900">
                    {incidentJustificationToDelete.workDate
                      ? formatShortDate(incidentJustificationToDelete.workDate)
                      : "Sin fecha"}{" "}
                    ·{" "}
                    {getRecordLine({
                      checkInAt: incidentJustificationToDelete.checkInAt ?? "",
                      checkOutAt:
                        incidentJustificationToDelete.checkOutAt ?? null,
                    })}
                  </p>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Motivo enviado
                  </p>
                  <p className="leading-6 text-slate-700">
                    {incidentJustificationToDelete.reason}
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-700">
                ¿Seguro que quieres ocultar esta respuesta?
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  className={POPUP_NEUTRAL_BUTTON_CLASS}
                  onClick={() => setIncidentJustificationToDelete(null)}
                  disabled={Boolean(deletingIncidentJustificationId)}
                >
                  Cancelar
                </Button>
                <Button
                  className={POPUP_DANGER_BUTTON_CLASS}
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
      {isManagerMode && adminCloseRecord ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold leading-none text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              onClick={closeAdminCloseModal}
              disabled={adminCloseSubmitting}
              aria-label="Volver al detalle"
              title="Volver al detalle"
            >
              ×
            </button>
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4 pr-12">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 shadow-sm ring-1 ring-slate-200">
                  <i className="ti ti-lock-check text-[21px]" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Cierre administrativo
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                    Cerrar jornada abierta
                  </h3>
                  <p className="max-w-md text-sm leading-6 text-slate-600">
                    Se registrará una salida manual para{" "}
                    <span className="font-semibold text-slate-900">
                      {getDisplayUserName(
                        adminCloseRecord.userId,
                        adminCloseRecord.userName,
                      )}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Entrada:</span>{" "}
                  {formatShortDate(adminCloseRecord.workDate)} ·{" "}
                  {formatTimeOnly(adminCloseRecord.checkInAt)}
                </p>
              </div>

              <Input
                label="Hora de salida"
                type="datetime-local"
                value={adminCloseCheckOutAt}
                onChange={(event) => setAdminCloseCheckOutAt(event.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Mensaje para el trabajador
                </label>
                <textarea
                  className="min-h-[110px] w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Ej. Jornada cerrada por administración tras revisar el fichaje abierto."
                  value={adminCloseComment}
                  onChange={(event) => setAdminCloseComment(event.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Este mensaje aparecerá en el detalle de la jornada del trabajador.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  className={POPUP_NEUTRAL_BUTTON_CLASS}
                  onClick={closeAdminCloseModal}
                  disabled={adminCloseSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  className={POPUP_PRIMARY_BUTTON_CLASS}
                  onClick={closeRecordAsAdmin}
                  disabled={adminCloseSubmitting}
                >
                  {adminCloseSubmitting ? "Cerrando..." : "Cerrar jornada"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
        {isWorkerMode && adjustmentRequestToDelete ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
            <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.9}
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.67 18h16.66a1 1 0 00.88-1.14l-7.5-13a1 1 0 00-1.74 0z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">
                      Acción de visibilidad
                    </p>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                      Ocultar solicitud respondida
                    </h3>
                    <p className="max-w-md text-sm leading-6 text-slate-600">
                      Esta acción quitará de tu vista una solicitud ya respondida
                      por administración.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-4 text-sm text-slate-700 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-600">
                      Solicitud
                    </p>
                    <p className="font-medium text-slate-900">
                      {ADJUSTMENT_TYPE_LABELS[adjustmentRequestToDelete.requestType]} ·{" "}
                      {formatShortDate(adjustmentRequestToDelete.requestDate)} ·{" "}
                      {formatTimeOnly(adjustmentRequestToDelete.requestedTime)}
                    </p>
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-600">
                      Motivo enviado
                    </p>
                    <p className="leading-6 text-slate-700">
                      {adjustmentRequestToDelete.reason}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-700">
                  ¿Seguro que quieres ocultar esta solicitud?
                </p>

                <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  className={POPUP_NEUTRAL_BUTTON_CLASS}
                  onClick={() => setAdjustmentRequestToDelete(null)}
                  disabled={Boolean(deletingAdjustmentRequestId)}
                >
                  Cancelar
                </Button>
                <Button
                  className={POPUP_DANGER_BUTTON_CLASS}
                  onClick={deleteAdjustmentRequest}
                  disabled={Boolean(deletingAdjustmentRequestId)}
                >
                  {deletingAdjustmentRequestId
                    ? "Ocultando..."
                    : "Ocultar"}
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
                className={POPUP_NEUTRAL_BUTTON_CLASS}
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
                  className={POPUP_NEUTRAL_BUTTON_CLASS}
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className={POPUP_PRIMARY_BUTTON_CLASS}
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
      <Modal
        open={showLocationHelp}
        onClose={() => setShowLocationHelp(false)}
        title="Ayuda para fichar con ubicación"
        panelClassName="max-w-xl"
      >
        <div className="space-y-4 text-sm text-slate-700">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="font-medium text-slate-900">
              Si el navegador bloquea la ubicación:
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
              <li>
                Haz clic en el candado o en el icono de ubicación junto a la
                barra de direcciones.
              </li>
              <li>
                Cambia el permiso de ubicación a <strong>Permitir</strong>.
              </li>
              <li>Recarga la página y vuelve a intentar fichar.</li>
            </ol>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
            Si sigue sin funcionar, revisa también los permisos de ubicación
            del navegador en la configuración del sistema.
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              className={POPUP_NEUTRAL_BUTTON_CLASS}
              onClick={() => setShowLocationHelp(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
      {/* Modal de Detalle de Fichaje (Cuadrante) */}
      <Modal
        open={!!selectedRecordForDetail}
        onClose={() => setSelectedRecordForDetail(null)}
        title="Detalle del Fichaje"
      >
        {selectedRecordForDetail &&
          renderRecordDetailContent(selectedRecordForDetail)}
      </Modal>
    </>
  );
}

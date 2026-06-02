import type { AuthenticatedApiUser } from "../../vacations/domain/types";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type {
  CloseCheckOutInput,
  CreateCheckInInput,
  IncidentFlag,
  TimeControlShift,
  TimeControlAdminValidationReason,
  TimeControlAdminValidationStatus,
  WorkdayDeviceType,
  WorkdayFilters,
  WorkdayRecord,
  WorkdayTrustLevel,
} from "../domain/types";
import {
  createWorkdayRecordsRepository,
  type WorkdayRecordsRepository,
} from "../repositories/workday-records.repository";
import { createTimeControlAllowedLocationsService } from "./time-control-allowed-locations.service";
import { createTimeControlShiftsService } from "./time-control-shifts.service";
import { createTimeControlTrustedNetworksService } from "./time-control-trusted-networks.service";

const WORKDAY_DURATION_TOLERANCE_MINUTES = 15;
const DEFAULT_EXPECTED_WORKDAY_MINUTES = 480;
const BUSINESS_TIME_ZONE = "Europe/Madrid";
const DEFAULT_SCHEDULE_START_MINUTES = 6 * 60;
const DEFAULT_SCHEDULE_END_MINUTES = 7 * 60 + 30;
const pad = (value: number, length = 2): string =>
  String(value).padStart(length, "0");

interface ResolvedShiftSegment {
  id: string;
  shiftId: string;
  shiftName: string;
  segmentOrder: number;
  startMinutes: number;
  endMinutes: number;
  toleranceStartMinutes: number;
  toleranceEndMinutes: number;
  expectedWorkedMinutes: number;
}

const getDatePartsInTimeZone = (value: Date) => {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(value);
  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
};

const toSqlDate = (value: Date): string => {
  const { year, month, day } = getDatePartsInTimeZone(value);
  return `${year}-${month}-${day}`;
};

const toSqlDateTime = (value: Date): string =>
  `${toSqlDate(value)} ${getDatePartsInTimeZone(value).hour}:${getDatePartsInTimeZone(
    value,
  ).minute}:${getDatePartsInTimeZone(value).second}.${pad(value.getMilliseconds(), 3)}`;

const parseSqlDateTime = (value: string): number => {
  const [datePart, timePart = "00:00:00.000"] = value.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [rawTime, rawMilliseconds = "0"] = timePart.split(".");
  const [hour, minute, second] = rawTime.split(":").map(Number);
  const milliseconds = Number(rawMilliseconds.padEnd(3, "0").slice(0, 3));

  return Date.UTC(
    year,
    (month ?? 1) - 1,
    day ?? 1,
    hour ?? 0,
    minute ?? 0,
    second ?? 0,
    milliseconds,
  );
};

const calculateWorkedDurationMs = (
  checkInAt: string,
  checkOutAt: string,
): number => parseSqlDateTime(checkOutAt) - parseSqlDateTime(checkInAt);

const calculateWorkedMinutes = (diffMs: number): number =>
  diffMs <= 0 ? 0 : Math.floor(diffMs / 60000);

const calculateOvertimeMinutes = (
  workedMinutes: number,
  expectedWorkedMinutes = DEFAULT_EXPECTED_WORKDAY_MINUTES,
): number =>
  workedMinutes > expectedWorkedMinutes
    ? workedMinutes - expectedWorkedMinutes
    : 0;

const buildIncidentFlags = (
  workedMinutes: number,
  expectedWorkedMinutes = DEFAULT_EXPECTED_WORKDAY_MINUTES,
): IncidentFlag[] | null => {
  const flags: IncidentFlag[] = [];
  const minimumExpectedMinutes = Math.max(
    0,
    expectedWorkedMinutes - WORKDAY_DURATION_TOLERANCE_MINUTES,
  );
  const maximumExpectedMinutes =
    expectedWorkedMinutes + WORKDAY_DURATION_TOLERANCE_MINUTES;

  if (workedMinutes < minimumExpectedMinutes) {
    flags.push("DURATION_TOO_SHORT");
  }

  if (workedMinutes > maximumExpectedMinutes) {
    flags.push("DURATION_TOO_LONG");
  }

  return flags.length > 0 ? flags : null;
};

const buildCheckInIncidentFlags = (
  value: Date,
  resolvedSegment?: ResolvedShiftSegment | null,
): IncidentFlag[] | null => {
  const { hour, minute } = getDatePartsInTimeZone(value);
  const totalMinutes = Number(hour) * 60 + Number(minute);
  const scheduleStartMinutes =
    resolvedSegment?.startMinutes ?? DEFAULT_SCHEDULE_START_MINUTES;
  const scheduleEndMinutes =
    resolvedSegment === null
      ? Number.NaN
      : resolvedSegment
        ? normalizeMinutes(
            scheduleStartMinutes + resolvedSegment.toleranceEndMinutes,
          )
        : DEFAULT_SCHEDULE_END_MINUTES;
  const windowStartMinutes = resolvedSegment
    ? normalizeMinutes(
        scheduleStartMinutes - resolvedSegment.toleranceStartMinutes,
      )
    : DEFAULT_SCHEDULE_START_MINUTES;

  if (
    Number.isNaN(totalMinutes) ||
    Number.isNaN(scheduleEndMinutes) ||
    !isMinutesWithinWindow(totalMinutes, windowStartMinutes, scheduleEndMinutes)
  ) {
    return ["OUT_OF_SCHEDULE"];
  }

  return null;
};

const parseSqlTimeToMinutes = (value: string): number => {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
};

const normalizeMinutes = (value: number): number => {
  const normalized = value % 1440;
  return normalized < 0 ? normalized + 1440 : normalized;
};

const isMinutesWithinWindow = (
  value: number,
  windowStart: number,
  windowEnd: number,
): boolean => {
  const normalizedValue = normalizeMinutes(value);
  const normalizedStart = normalizeMinutes(windowStart);
  const normalizedEnd = normalizeMinutes(windowEnd);

  if (normalizedStart <= normalizedEnd) {
    return (
      normalizedValue >= normalizedStart && normalizedValue <= normalizedEnd
    );
  }

  return normalizedValue >= normalizedStart || normalizedValue <= normalizedEnd;
};

const calculateSegmentWorkedMinutes = (
  startMinutes: number,
  endMinutes: number,
): number => {
  if (endMinutes >= startMinutes) {
    return endMinutes - startMinutes;
  }

  return 1440 - startMinutes + endMinutes;
};

const resolveShiftSegments = (
  shift: TimeControlShift,
): ResolvedShiftSegment[] => {
  return shift.segments
    .slice()
    .sort((left, right) => left.segmentOrder - right.segmentOrder)
    .map((segment) => {
      const startMinutes = parseSqlTimeToMinutes(segment.startTime);
      const endMinutes = parseSqlTimeToMinutes(segment.endTime);
      return {
        id: segment.id,
        shiftId: shift.id,
        shiftName: shift.name,
        segmentOrder: segment.segmentOrder,
        startMinutes,
        endMinutes,
        toleranceStartMinutes: segment.toleranceStartMinutes,
        toleranceEndMinutes: segment.toleranceEndMinutes,
        expectedWorkedMinutes: calculateSegmentWorkedMinutes(
          startMinutes,
          endMinutes,
        ),
      };
    });
};

const resolveShiftSegmentForDate = (
  shift: TimeControlShift | null,
  value: Date,
): ResolvedShiftSegment | null => {
  if (!shift || shift.segments.length === 0) {
    return null;
  }

  const { hour, minute } = getDatePartsInTimeZone(value);
  const totalMinutes = Number(hour) * 60 + Number(minute);

  return (
    resolveShiftSegments(shift).find((segment) =>
      isMinutesWithinWindow(
        totalMinutes,
        segment.startMinutes - segment.toleranceStartMinutes,
        segment.startMinutes + segment.toleranceEndMinutes,
      ),
    ) ?? null
  );
};

const resolveShiftSegmentForRecord = (
  shift: TimeControlShift | null,
  checkInAt: string,
): ResolvedShiftSegment | null => {
  if (!shift || shift.segments.length === 0) {
    return null;
  }

  const [, timePart = "00:00:00.000"] = checkInAt.split(" ");
  const [rawTime] = timePart.split(".");
  const totalMinutes = parseSqlTimeToMinutes(rawTime);

  return (
    resolveShiftSegments(shift).find((segment) =>
      isMinutesWithinWindow(
        totalMinutes,
        segment.startMinutes - segment.toleranceStartMinutes,
        segment.startMinutes + segment.toleranceEndMinutes,
      ),
    ) ?? null
  );
};

const toRadians = (value: number): number => (value * Math.PI) / 180;

const calculateDistanceMeters = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number => {
  const earthRadiusMeters = 6371000;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const normalizedLatitudeA = toRadians(latitudeA);
  const normalizedLatitudeB = toRadians(latitudeB);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(normalizedLatitudeA) *
      Math.cos(normalizedLatitudeB) *
      Math.sin(deltaLongitude / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
};

export interface FichajeLocationInput {
  latitude: number;
  longitude: number;
  deviceType?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceReason?: string | null;
}

const buildLocationIncidentFlags = (
  location: FichajeLocationInput,
  allowedLocations: ReadonlyArray<{
    latitude: number;
    longitude: number;
    radiusMeters: number;
  }>,
): IncidentFlag[] | null => {
  const isInsideAllowedPoint = allowedLocations.some((point) => {
    const distanceMeters = calculateDistanceMeters(
      location.latitude,
      location.longitude,
      point.latitude,
      point.longitude,
    );

    return distanceMeters <= point.radiusMeters;
  });

  return isInsideAllowedPoint ? null : ["OUT_OF_ALLOWED_LOCATION"];
};

const mergeIncidentFlags = (
  ...flagsCollections: Array<IncidentFlag[] | null>
): IncidentFlag[] | null => {
  const merged = new Set<IncidentFlag>();

  for (const flags of flagsCollections) {
    for (const flag of flags ?? []) {
      merged.add(flag);
    }
  }

  return merged.size > 0 ? Array.from(merged) : null;
};

const hasLocationOutsideAllowedPoint = (
  flags: IncidentFlag[] | null,
): boolean => Boolean(flags?.includes("OUT_OF_ALLOWED_LOCATION"));

const normalizeLocationIncidentFlags = (
  deviceType: WorkdayDeviceType,
  flags: IncidentFlag[] | null,
): IncidentFlag[] | null => {
  if (deviceType !== "MOBILE" || !hasLocationOutsideAllowedPoint(flags)) {
    return flags;
  }

  const filteredFlags = flags?.filter(
    (flag) => flag !== "OUT_OF_ALLOWED_LOCATION",
  );

  return filteredFlags && filteredFlags.length > 0 ? filteredFlags : null;
};

const hasGlobalTimeControlManagement = (
  user: AuthenticatedApiUser,
): boolean => user.role === "admin" || user.canManageTimeControlRequests;

const validateCoordinates = (latitude: number, longitude: number): void => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("La ubicación del fichaje no es válida.");
  }
};

const normalizeDeviceType = (value?: string | null): WorkdayDeviceType => {
  switch (value) {
    case "MOBILE":
    case "TABLET":
    case "DESKTOP":
      return value;
    default:
      return "UNKNOWN";
  }
};

const isDeviceAllowedForPolicy = (
  deviceType: WorkdayDeviceType,
  policy: AuthenticatedApiUser["timeControlDevicePolicy"],
): boolean => {
  switch (policy) {
    case "MOBILE_ONLY":
      return deviceType === "MOBILE";
    case "TABLET_OR_MOBILE":
      return deviceType === "TABLET" || deviceType === "MOBILE";
    case "TABLET_ONLY":
    default:
      return deviceType === "TABLET";
  }
};

const buildDeviceIncidentFlags = (
  user: AuthenticatedApiUser,
  deviceType: WorkdayDeviceType,
): IncidentFlag[] | null => {
  if (isDeviceAllowedForPolicy(deviceType, user.timeControlDevicePolicy)) {
    return null;
  }

  return ["DEVICE_NOT_ALLOWED"];
};

const normalizeDeviceReason = (
  deviceType: WorkdayDeviceType,
  value?: string | null,
): string | null => {
  const normalized = value?.trim() ?? "";

  if (deviceType !== "MOBILE") {
    return normalized || null;
  }

  if (!normalized) {
    throw new Error("Debes indicar un motivo cuando fichas desde móvil.");
  }

  return normalized;
};

const normalizeUserAgent = (value?: string | null): string | null => {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized.slice(0, 2048) : null;
};

const hasSuspiciousDevice = (record: WorkdayRecord): boolean =>
  record.checkInDeviceType === "DESKTOP" ||
  record.checkInDeviceType === "UNKNOWN" ||
  record.checkOutDeviceType === "DESKTOP" ||
  record.checkOutDeviceType === "UNKNOWN";

const calculateTrustLevel = (record: WorkdayRecord): WorkdayTrustLevel => {
  if (
    !Number.isFinite(record.checkInLatitude) ||
    !Number.isFinite(record.checkInLongitude)
  ) {
    return "INVÁLIDA";
  }

  if (
    record.incidentFlags?.includes("OUT_OF_ALLOWED_LOCATION") ||
    record.incidentFlags?.includes("DEVICE_NOT_ALLOWED") ||
    hasSuspiciousDevice(record)
  ) {
    return "BAJA";
  }

  if (record.adminValidationReason === "OUTSIDE_ALLOWED_LOCATION") {
    return "MEDIA";
  }

  return "ALTA";
};

const resolveAdminValidationReason = (
  record: Pick<
    WorkdayRecord,
    "checkInDeviceType" | "checkOutDeviceType" | "incidentFlags"
  >,
  hasOutsideAllowedLocationOnMobile = false,
): TimeControlAdminValidationReason | null => {
  if (record.incidentFlags?.includes("DEVICE_NOT_ALLOWED")) {
    return "DEVICE_NOT_ALLOWED";
  }

  if (hasOutsideAllowedLocationOnMobile) {
    return "OUTSIDE_ALLOWED_LOCATION";
  }

  if (
    record.checkInDeviceType === "UNKNOWN" ||
    record.checkOutDeviceType === "UNKNOWN"
  ) {
    return "UNKNOWN_DEVICE";
  }

  if (
    record.checkInDeviceType === "DESKTOP" ||
    record.checkOutDeviceType === "DESKTOP"
  ) {
    return "DESKTOP_DEVICE";
  }

  return null;
};

const resolveAdminValidationStatus = (
  record: Pick<
    WorkdayRecord,
    "requiresAdminValidation" | "adminValidationStatus"
  >,
): TimeControlAdminValidationStatus | null => {
  if (!record.requiresAdminValidation) {
    return null;
  }

  return record.adminValidationStatus ?? "PENDING";
};

export interface WorkdayRecordsService {
  checkIn(
    user: AuthenticatedApiUser,
    location: FichajeLocationInput,
  ): Promise<WorkdayRecord>;
  checkOut(
    user: AuthenticatedApiUser,
    location: FichajeLocationInput,
  ): Promise<WorkdayRecord>;
  getMyRecords(
    user: AuthenticatedApiUser,
    filters?: Omit<WorkdayFilters, "userId">,
  ): Promise<WorkdayRecord[]>;
  getAdminRecords(
    user: AuthenticatedApiUser,
    filters?: WorkdayFilters,
  ): Promise<WorkdayRecord[]>;
  getIncidents(
    user: AuthenticatedApiUser,
    filters?: WorkdayFilters,
  ): Promise<WorkdayRecord[]>;
  reviewAdminValidation(
    user: AuthenticatedApiUser,
    recordId: string,
    status: Extract<TimeControlAdminValidationStatus, "APPROVED" | "REJECTED">,
    comment?: string | null,
  ): Promise<WorkdayRecord>;
}

export class TimeControlService implements WorkdayRecordsService {
  constructor(
    private readonly repository: WorkdayRecordsRepository = createWorkdayRecordsRepository(),
    private readonly directoryRepository = createDirectoryRepository(),
    private readonly allowedLocationsService = createTimeControlAllowedLocationsService(),
    private readonly shiftsService = createTimeControlShiftsService(),
    private readonly trustedNetworksService = createTimeControlTrustedNetworksService(),
  ) {}

  private async getAllowedLocations() {
    return this.allowedLocationsService.listActive();
  }

  private async getTrustedNetworkCheckerSafe() {
    try {
      return await this.trustedNetworksService.getTrustedNetworkChecker();
    } catch {
      return () => false;
    }
  }

  private async decorateRecord(record: WorkdayRecord): Promise<WorkdayRecord> {
    const trustedNetworkChecker = await this.getTrustedNetworkCheckerSafe();
    const isTrustedNetwork = trustedNetworkChecker(record.checkInIpAddress);
    const adminValidationReason = resolveAdminValidationReason(record);

    return {
      ...record,
      isTrustedNetwork,
      requiresAdminValidation:
        record.requiresAdminValidation || adminValidationReason !== null,
      adminValidationReason:
        record.adminValidationReason ?? adminValidationReason,
      adminValidationStatus: resolveAdminValidationStatus({
        requiresAdminValidation:
          record.requiresAdminValidation || adminValidationReason !== null,
        adminValidationStatus: record.adminValidationStatus,
      }),
      trustLevel: calculateTrustLevel(record),
    };
  }

  private async decorateRecords(records: WorkdayRecord[]): Promise<WorkdayRecord[]> {
    if (records.length === 0) {
      return records;
    }

    const trustedNetworkChecker = await this.getTrustedNetworkCheckerSafe();

    return records.map((record) => {
      const isTrustedNetwork = trustedNetworkChecker(record.checkInIpAddress);
      const adminValidationReason = resolveAdminValidationReason(record);
      return {
        ...record,
        isTrustedNetwork,
        requiresAdminValidation:
          record.requiresAdminValidation || adminValidationReason !== null,
        adminValidationReason:
          record.adminValidationReason ?? adminValidationReason,
        adminValidationStatus: resolveAdminValidationStatus({
          requiresAdminValidation:
            record.requiresAdminValidation || adminValidationReason !== null,
          adminValidationStatus: record.adminValidationStatus,
        }),
        trustLevel: calculateTrustLevel(record),
      };
    });
  }

  async checkIn(
    user: AuthenticatedApiUser,
    location: FichajeLocationInput,
  ): Promise<WorkdayRecord> {
    validateCoordinates(location.latitude, location.longitude);

    const now = new Date();
    const nowDateTime = toSqlDateTime(now);
    const workDate = toSqlDate(now);
    const normalizedDeviceType = normalizeDeviceType(location.deviceType);
    const normalizedDeviceReason = normalizeDeviceReason(
      normalizedDeviceType,
      location.deviceReason,
    );
    const normalizedUserAgent = normalizeUserAgent(location.userAgent);
    const allowedLocations = await this.getAllowedLocations();
    const rawLocationIncidentFlags = buildLocationIncidentFlags(
      location,
      allowedLocations,
    );
    const hasOutsideAllowedLocationOnMobile =
      normalizedDeviceType === "MOBILE" &&
      hasLocationOutsideAllowedPoint(rawLocationIncidentFlags);
    const assignedShift = await this.shiftsService.findAssignedShiftByUserId(
      user.userId,
    );
    const resolvedSegment = resolveShiftSegmentForDate(assignedShift, now);
    const incidentFlags = mergeIncidentFlags(
      buildCheckInIncidentFlags(now, assignedShift ? resolvedSegment : undefined),
      normalizeLocationIncidentFlags(
        normalizedDeviceType,
        rawLocationIncidentFlags,
      ),
      buildDeviceIncidentFlags(user, normalizedDeviceType),
    );

    const openRecord = await this.repository.findOpenByUserId(user.userId);
    if (openRecord) {
      throw new Error("Ya existe una jornada abierta para este usuario.");
    }

    const adminValidationReason = resolveAdminValidationReason(
      {
        checkInDeviceType: normalizedDeviceType,
        checkOutDeviceType: null,
        incidentFlags,
      },
      hasOutsideAllowedLocationOnMobile,
    );

    const input: CreateCheckInInput = {
      id: `wdr-${crypto.randomUUID()}`,
      userId: user.userId,
      workDate,
      checkInAt: nowDateTime,
      checkInLatitude: location.latitude,
      checkInLongitude: location.longitude,
      checkInDeviceType: normalizedDeviceType,
      checkInIpAddress: location.ipAddress?.trim() || null,
      checkInUserAgent: normalizedUserAgent,
      checkInDeviceReason: normalizedDeviceReason,
      requiresAdminValidation: adminValidationReason !== null,
      adminValidationReason,
      adminValidationStatus: adminValidationReason ? "PENDING" : null,
      adminValidatedBy: null,
      adminValidatedAt: null,
      adminValidationComment: null,
      status: "OPEN",
      workedMinutes: 0,
      overtimeMinutes: 0,
      incidentFlags,
      createdAt: nowDateTime,
      updatedAt: nowDateTime,
    };

    return this.decorateRecord(await this.repository.createCheckIn(input));
  }

  async checkOut(
    user: AuthenticatedApiUser,
    location: FichajeLocationInput,
  ): Promise<WorkdayRecord> {
    validateCoordinates(location.latitude, location.longitude);

    const openRecord = await this.repository.findOpenByUserId(user.userId);
    if (!openRecord) {
      throw new Error("No existe una jornada abierta para este usuario.");
    }

    const now = new Date();
    const checkOutAt = toSqlDateTime(now);
    const normalizedDeviceType = normalizeDeviceType(location.deviceType);
    const normalizedDeviceReason = normalizeDeviceReason(
      normalizedDeviceType,
      location.deviceReason,
    );
    const normalizedUserAgent = normalizeUserAgent(location.userAgent);
    const workedDurationMs = calculateWorkedDurationMs(
      openRecord.checkInAt,
      checkOutAt,
    );
    const workedMinutes = calculateWorkedMinutes(workedDurationMs);

    if (workedDurationMs <= 0) {
      throw new Error("La hora de salida debe ser posterior a la hora de entrada.");
    }

    const assignedShift = await this.shiftsService.findAssignedShiftByUserId(
      user.userId,
    );
    const resolvedSegment = resolveShiftSegmentForRecord(
      assignedShift,
      openRecord.checkInAt,
    );
    const allowedLocations = await this.getAllowedLocations();
    const rawLocationIncidentFlags = buildLocationIncidentFlags(
      location,
      allowedLocations,
    );
    const hasOutsideAllowedLocationOnMobile =
      normalizedDeviceType === "MOBILE" &&
      hasLocationOutsideAllowedPoint(rawLocationIncidentFlags);
    const incidentFlags = mergeIncidentFlags(
      openRecord.incidentFlags,
      buildIncidentFlags(
        workedMinutes,
        resolvedSegment?.expectedWorkedMinutes ?? DEFAULT_EXPECTED_WORKDAY_MINUTES,
      ),
      normalizeLocationIncidentFlags(
        normalizedDeviceType,
        rawLocationIncidentFlags,
      ),
      buildDeviceIncidentFlags(user, normalizedDeviceType),
    );
    const adminValidationReason = resolveAdminValidationReason(
      {
        checkInDeviceType: openRecord.checkInDeviceType,
        checkOutDeviceType: normalizedDeviceType,
        incidentFlags,
      },
      openRecord.adminValidationReason === "OUTSIDE_ALLOWED_LOCATION" ||
        hasOutsideAllowedLocationOnMobile,
    );
    const overtimeMinutes = calculateOvertimeMinutes(
      workedMinutes,
      resolvedSegment?.expectedWorkedMinutes ?? DEFAULT_EXPECTED_WORKDAY_MINUTES,
    );
    const input: CloseCheckOutInput = {
      recordId: openRecord.id,
      checkOutAt,
      checkOutLatitude: location.latitude,
      checkOutLongitude: location.longitude,
      checkOutDeviceType: normalizedDeviceType,
      checkOutIpAddress: location.ipAddress?.trim() || null,
      checkOutUserAgent: normalizedUserAgent,
      checkOutDeviceReason: normalizedDeviceReason,
      requiresAdminValidation:
        openRecord.requiresAdminValidation || adminValidationReason !== null,
      adminValidationReason:
        openRecord.adminValidationReason ?? adminValidationReason,
      adminValidationStatus:
        openRecord.adminValidationStatus ??
        (openRecord.requiresAdminValidation || adminValidationReason !== null
          ? "PENDING"
          : null),
      adminValidatedBy: openRecord.adminValidatedBy,
      adminValidatedAt: openRecord.adminValidatedAt,
      adminValidationComment: openRecord.adminValidationComment,
      workedMinutes,
      overtimeMinutes,
      status: incidentFlags ? "INCIDENT" : "COMPLETED",
      incidentFlags,
      updatedAt: checkOutAt,
    };

    return this.decorateRecord(await this.repository.closeCheckOut(input));
  }

  async getMyRecords(
    user: AuthenticatedApiUser,
    filters?: Omit<WorkdayFilters, "userId">,
  ): Promise<WorkdayRecord[]> {
    const records = await this.repository.listByUser(user.userId, filters);
    return this.decorateRecords(records);
  }

  async getAdminRecords(
    user: AuthenticatedApiUser,
    filters?: WorkdayFilters,
  ): Promise<WorkdayRecord[]> {
    const records = await this.getScopedAdminRecords(user, filters);
    return this.attachUserNames(records);
  }

  async getIncidents(
    user: AuthenticatedApiUser,
    filters?: WorkdayFilters,
  ): Promise<WorkdayRecord[]> {
    const records = await this.getScopedIncidentRecords(user, filters);
    return this.attachUserNames(records);
  }

  async reviewAdminValidation(
    user: AuthenticatedApiUser,
    recordId: string,
    status: Extract<TimeControlAdminValidationStatus, "APPROVED" | "REJECTED">,
    comment?: string | null,
  ): Promise<WorkdayRecord> {
    if (!hasGlobalTimeControlManagement(user)) {
      throw new Error("FORBIDDEN");
    }

    const record = await this.repository.findById(recordId);
    if (!record) {
      throw new Error("No se encontró el fichaje.");
    }

    if (!record.requiresAdminValidation) {
      throw new Error("Este fichaje no requiere validación administrativa.");
    }

    const currentStatus = resolveAdminValidationStatus(record);
    if (currentStatus && currentStatus !== "PENDING") {
      throw new Error(
        "La validación administrativa de este fichaje ya está resuelta.",
      );
    }

    const trimmedComment = comment?.trim() ?? "";
    if (status === "REJECTED" && !trimmedComment) {
      throw new Error("Debes indicar un motivo para rechazar el fichaje.");
    }

    const now = new Date();
    return this.decorateRecord(
      await this.repository.reviewAdminValidation({
        recordId,
        adminValidationStatus: status,
        adminValidatedBy: user.userId,
        adminValidatedAt: toSqlDateTime(now),
        adminValidationComment: trimmedComment || null,
        updatedAt: toSqlDateTime(now),
      }),
    );
  }

  private async getAllowedUserIds(
    user: AuthenticatedApiUser,
  ): Promise<Set<string>> {
    if (hasGlobalTimeControlManagement(user)) {
      const allUsers = await this.directoryRepository.listAllUsers();
      return new Set(allUsers.map((entry) => entry.id));
    }

    const departmentIds = new Set<string>(user.coordinatorDepartmentIds);
    if (user.role === "coordinator" && departmentIds.size === 0) {
      departmentIds.add(user.departmentId);
    }

    const usersByDepartment = await Promise.all(
      Array.from(departmentIds).map((departmentId) =>
        this.directoryRepository.listByDepartment(departmentId),
      ),
    );

    return new Set(usersByDepartment.flat().map((entry) => entry.id));
  }

  private async getScopedAdminRecords(
    user: AuthenticatedApiUser,
    filters?: WorkdayFilters,
  ): Promise<WorkdayRecord[]> {
    if (hasGlobalTimeControlManagement(user)) {
      return this.repository.listAdmin(filters);
    }

    if (user.role !== "coordinator") {
      throw new Error("FORBIDDEN");
    }

    const allowedUserIds = await this.getAllowedUserIds(user);
    if (filters?.userId && !allowedUserIds.has(filters.userId)) {
      throw new Error("FORBIDDEN");
    }

    const records = await this.repository.listAdmin(filters);
    return records.filter((record) => allowedUserIds.has(record.userId));
  }

  private async getScopedIncidentRecords(
    user: AuthenticatedApiUser,
    filters?: WorkdayFilters,
  ): Promise<WorkdayRecord[]> {
    if (hasGlobalTimeControlManagement(user)) {
      return this.repository.listIncidents(filters);
    }

    if (user.role !== "coordinator") {
      throw new Error("FORBIDDEN");
    }

    const allowedUserIds = await this.getAllowedUserIds(user);
    if (filters?.userId && !allowedUserIds.has(filters.userId)) {
      throw new Error("FORBIDDEN");
    }

    const records = await this.repository.listIncidents(filters);
    return records.filter((record) => allowedUserIds.has(record.userId));
  }

  private async attachUserNames(records: WorkdayRecord[]): Promise<WorkdayRecord[]> {
    if (records.length === 0) {
      return records;
    }

    const users = await this.directoryRepository.listAllUsers();
    const userNamesById = new Map(users.map((entry) => [entry.id, entry.name]));
    const decoratedRecords = await this.decorateRecords(records);

    return decoratedRecords.map((record) => ({
      ...record,
      userName: userNamesById.get(record.userId) ?? null,
    }));
  }
}

export const createTimeControlService = (): WorkdayRecordsService =>
  new TimeControlService();

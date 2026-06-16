import { useEffect, useMemo, useState } from "react";
import type { UserSession } from "../../../core/types";
import type { WorkdayDeviceType, WorkdayRecord } from "../domain/types";

interface GlobalOpenWorkdayWarningProps {
  session: UserSession | null;
}

interface OpenWorkdayWarning {
  record: WorkdayRecord;
  level: "warning" | "critical";
  minutesOpen: number;
}

type LocationPayload = {
  latitude: number;
  longitude: number;
  deviceType: WorkdayDeviceType;
};

const OPEN_WORKDAY_WARNING_MINUTES = 8 * 60 + 15;
const OPEN_WORKDAY_CRITICAL_MINUTES = 24 * 60;
const GLOBAL_OPEN_WORKDAY_REFRESH_MS = 10_000;

const formatSqlDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatShortDate = (value: string): string =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

const formatTimeOnly = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";

const formatHoursFromMinutes = (minutes: number): string => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

const detectCurrentWorkdayDeviceType = (): WorkdayDeviceType => {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return "UNKNOWN";
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const hasTouch = navigator.maxTouchPoints > 0;
  const shorterSide = Math.min(window.screen.width, window.screen.height);

  if (
    userAgent.includes("ipad") ||
    userAgent.includes("tablet") ||
    (hasTouch && shorterSide >= 600)
  ) {
    return "TABLET";
  }

  if (
    userAgent.includes("mobi") ||
    userAgent.includes("iphone") ||
    userAgent.includes("android")
  ) {
    return "MOBILE";
  }

  return "DESKTOP";
};

const getOpenWorkdayMinutes = (record: WorkdayRecord): number => {
  const checkInTime = new Date(record.checkInAt).getTime();

  if (!Number.isFinite(checkInTime)) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - checkInTime) / 60000));
};

const getCurrentLocation = (): Promise<LocationPayload> =>
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
          deviceType: detectCurrentWorkdayDeviceType(),
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

export function GlobalOpenWorkdayWarning({
  session,
}: GlobalOpenWorkdayWarningProps) {
  const [records, setRecords] = useState<WorkdayRecord[]>([]);
  const [warning, setWarning] = useState<OpenWorkdayWarning | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTabletCodeRequested, setIsTabletCodeRequested] = useState(false);
  const [tabletCode, setTabletCode] = useState("");
  const [tabletCodeError, setTabletCodeError] = useState<string | null>(null);

  const storageKey = useMemo(() => {
    if (!warning) return null;
    return `time-control:open-workday-warning:${warning.record.id}:${warning.level}`;
  }, [warning]);

  const openRecord = useMemo(
    () =>
      records
        .filter((record) => record.status === "OPEN")
        .sort((left, right) => right.checkInAt.localeCompare(left.checkInAt))[0] ??
      null,
    [records],
  );

  const openRecordMinutes = openRecord ? getOpenWorkdayMinutes(openRecord) : 0;

  const loadRecords = async () => {
    if (!session) {
      setRecords([]);
      return;
    }

    try {
      const now = new Date();
      const dateTo = formatSqlDate(now);
      const dateFromSource = new Date(now);
      dateFromSource.setMonth(dateFromSource.getMonth() - 12);

      const params = new URLSearchParams({
        dateFrom: formatSqlDate(dateFromSource),
        dateTo,
        includeOpen: "1",
      });
      const response = await fetch(`/api/time-control/me?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        items?: WorkdayRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudieron cargar tus fichajes.");
      }

      setRecords(data.items ?? []);
    } catch {
      setRecords([]);
    }
  };

  useEffect(() => {
    if (!session) return;

    void loadRecords();

    const refresh = () => void loadRecords();
    window.addEventListener("focus", refresh);
    const intervalId = window.setInterval(
      refresh,
      GLOBAL_OPEN_WORKDAY_REFRESH_MS,
    );

    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(intervalId);
    };
  }, [session?.email]);

  useEffect(() => {
    if (!session) {
      setWarning(null);
      return;
    }

    if (!openRecord) {
      setWarning(null);
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
      setWarning(null);
      return;
    }

    const nextStorageKey = `time-control:open-workday-warning:${openRecord.id}:${level}`;
    try {
      if (window.sessionStorage.getItem(nextStorageKey)) {
        return;
      }
    } catch {
      // Si sessionStorage falla, mostramos el aviso igualmente.
    }

    setWarning({ record: openRecord, level, minutesOpen });
  }, [openRecord, session]);

  const postponeWarning = () => {
    if (storageKey) {
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // No bloqueamos el cierre del aviso si el almacenamiento no está disponible.
      }
    }

    setWarning(null);
    setErrorMessage(null);
  };

  const closeOpenWorkday = async (confirmedTabletCode?: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const deviceType = detectCurrentWorkdayDeviceType();
      if (deviceType === "TABLET" && confirmedTabletCode === undefined) {
        setIsTabletCodeRequested(true);
        setIsSubmitting(false);
        return;
      }

      const location = await getCurrentLocation();
      const response = await fetch("/api/time-control/check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...location,
          tabletCode: confirmedTabletCode,
        }),
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(
          response,
          "No se pudo fichar la salida.",
        );
        throw new Error(message);
      }

      if (storageKey) {
        try {
          window.sessionStorage.setItem(storageKey, "1");
        } catch {
          // El fichaje ya se ha guardado; no pasa nada si no marcamos el aviso.
        }
      }

      window.dispatchEvent(new CustomEvent("time-control:records-updated"));
      setWarning(null);
      await loadRecords();
      window.location.href = "/control-horario";
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo fichar la salida.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmTabletCodeAndClose = async () => {
    const normalizedCode = tabletCode.trim();
    if (!normalizedCode) {
      setTabletCodeError("Introduce el código de la tablet para continuar.");
      return;
    }

    setIsTabletCodeRequested(false);
    setTabletCodeError(null);
    await closeOpenWorkday(normalizedCode);
    setTabletCode("");
  };

  if (!warning && !openRecord) {
    return null;
  }

  const isCritical = warning?.level === "critical";
  const isTimeControlRoute =
    typeof window !== "undefined" && window.location.pathname === "/control-horario";
  const shouldShowOpenWorkdayBanner = openRecord && !warning && !isTimeControlRoute;
  const shouldRemindToCloseOpenWorkday = openRecordMinutes >= 7 * 60;

  return (
    <>
    {shouldShowOpenWorkdayBanner ? (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          window.location.href = "/control-horario";
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.location.href = "/control-horario";
          }
        }}
        className="global-open-workday-banner fixed left-1/2 top-3 z-[55] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-left shadow-xl shadow-emerald-950/10 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800">
                Jornada abierta
              </p>
              <p className="text-sm font-medium leading-5 text-emerald-900">
                Entrada {formatTimeOnly(openRecord.checkInAt)}
                <br />
                {formatHoursFromMinutes(openRecordMinutes)} acumuladas
              </p>
              {shouldRemindToCloseOpenWorkday ? (
                <p className="mt-1 text-xs leading-5 text-emerald-700/85">
                  No te olvides de cerrar la jornada cuando termines.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    ) : null}

    {warning ? (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
      {isTabletCodeRequested ? (
        <form
          className="w-full max-w-sm rounded-[1.7rem] border border-slate-200 bg-white p-6 text-left shadow-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            void confirmTabletCodeAndClose();
          }}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <i className="ti ti-device-tablet-code text-[24px]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                Fichaje desde tablet
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Introduce el código de fichaje
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Confirma el código de la tablet para registrar la salida.
              </p>
            </div>
          </div>

          <label
            htmlFor="global-tablet-clock-code"
            className="mt-5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            Código
          </label>
          <input
            id="global-tablet-clock-code"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={tabletCode}
            onChange={(event) => {
              setTabletCode(event.target.value);
              setTabletCodeError(null);
            }}
            placeholder="Código de tablet"
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-lg font-semibold text-slate-900 shadow-inner outline-none transition placeholder:tracking-normal focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
            autoFocus
          />

          {tabletCodeError || errorMessage ? (
            <p className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {tabletCodeError ?? errorMessage}
            </p>
          ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setIsTabletCodeRequested(false);
                setTabletCode("");
                setTabletCodeError(null);
              }}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Registrando..." : "Continuar"}
            </button>
          </div>
        </form>
      ) : (
      <div className="w-full max-w-md rounded-[1.7rem] border border-slate-200 bg-white p-6 text-center shadow-2xl">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            isCritical
              ? "bg-rose-100 text-rose-600"
              : "bg-amber-100 text-amber-600"
          }`}
        >
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.25}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
          </svg>
        </div>

        <h3 className="mt-4 text-xl font-bold text-slate-950">
          {isCritical ? "Jornada abierta hace más de 24h" : "Jornada abierta"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isCritical
            ? "Esta jornada lleva abierta desde hace más de 24 horas. Revisa si olvidaste fichar la salida."
            : "Tu jornada lleva abierta más de 8 horas y 15 minutos. Si ya has terminado, puedes fichar la salida ahora."}
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Entrada:</span>{" "}
            {formatShortDate(warning.record.workDate)} ·{" "}
            {formatTimeOnly(warning.record.checkInAt)}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-slate-900">Tiempo abierta:</span>{" "}
            {formatHoursFromMinutes(warning.minutesOpen)}
          </p>
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-left text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={postponeWarning}
            disabled={isSubmitting}
            className="group flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            {/* Icono de reloj para recordar después */}
            <svg
              className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Recordármelo después</span>
          </button>
          
          <button
            type="button"
            onClick={() => void closeOpenWorkday()}
            disabled={isSubmitting}
            className={`group flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-5 text-sm font-semibold shadow-sm transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
              isCritical
                ? "border-rose-500 text-rose-600 hover:bg-rose-50"
                : "border-sky-500 text-sky-600 hover:bg-sky-50"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className={`h-4 w-4 animate-spin ${isCritical ? "text-rose-500" : "text-sky-500"}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <svg
                  className={`h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 ${
                    isCritical ? "text-rose-500" : "text-sky-500"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Fichar salida</span>
              </>
            )}
          </button>
        </div>
      </div>
      )}
    </div>
    ) : null}
    </>
  );
}

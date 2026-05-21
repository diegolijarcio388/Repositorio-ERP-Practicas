import { useEffect, useMemo, useState } from "react";
import { getContainer } from "../../core/di/container";
import {
  getYear,
  setYear,
  subscribeYearChange,
} from "../../core/year/year-context";
import type { UserSession, Year } from "../../core/types";
import { SUPPORTED_YEARS } from "../../core/types";
import { Select } from "./Select";
import { Button } from "./Button";

interface TopbarControlsProps {
  initialSession: UserSession | null;
  showYear?: boolean;
  showSession?: boolean;
  showRole?: boolean;
  showLogout?: boolean;
}

export function TopbarControls({
  initialSession,
  showYear = true,
  showSession = true,
  showRole = true,
  showLogout = true,
}: TopbarControlsProps) {
  const [year, setCurrentYear] = useState<Year>(getYear());
  const [session, setSession] = useState<UserSession | null>(initialSession);
  const auth = useMemo(() => getContainer().auth, []);

  useEffect(() => {
    const unsubscribeYear = subscribeYearChange((nextYear) =>
      setCurrentYear(nextYear),
    );
    const unsubscribeSession = auth.subscribe((nextSession) =>
      setSession(nextSession),
    );
    return () => {
      unsubscribeYear();
      unsubscribeSession();
    };
  }, [auth]);

  const handleLogout = async () => {
    await auth.logout();
    window.location.href = "/login";
  };

  return (
<div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 min-h-[44px]">
  
  {/* 1. Contrapeso izquierdo: Div vacío que ocupa el mismo espacio que el de la derecha para forzar el centro */}
  <div className="min-w-0"></div>

  {/* 2. Centro: El selector de año */}
  <div className="flex justify-center min-w-0">
    {showYear ? (
      <div className="w-[120px] flex-shrink-0">
        <Select
          aria-label="Seleccionar año"
          options={SUPPORTED_YEARS.map((candidateYear) => ({
            label: String(candidateYear),
            value: String(candidateYear),
          }))}
          value={String(year)}
          className="h-10 py-0 leading-[2.5rem]"
          onChange={(event) => setYear(Number(event.target.value))}
        />
      </div>
    ) : null}
  </div>

  {/* 3. Derecha: La sesión alineada a la derecha (justify-end) */}
  <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0">
    {showSession && session ? (
      <span className="text-[11px] sm:text-sm font-medium text-slate-600 truncate max-w-[80px] min-[400px]:max-w-[120px] md:max-w-[160px] lg:max-w-none">
        {session.email}
      </span>
    ) : null}

    {showRole && session && session.role !== "Empleado" ? (
      <span className="rounded bg-slate-100 px-2 py-1 text-xs whitespace-nowrap">
        {session.role}
      </span>
    ) : null}

    {showLogout && session ? (
      <Button
        variant="secondary"
        className="px-2 py-1.5 sm:px-4 sm:py-2 flex-shrink-0"
        onClick={handleLogout}
        aria-label="Cerrar sesion"
      >
        <span className="sr-only">Cerrar sesion</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </Button>
    ) : null}
  </div>
</div>
  );
}

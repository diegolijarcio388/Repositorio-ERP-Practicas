import { useMemo, useState } from "react";
import { Button } from "../../../shared/ui";

interface DayMultiSelectProps {
  blockedDays: Set<string>;
  holidayDays: Set<string>;
  pendingDays: Set<string>;
  approvedDays: Set<string>;
  eventTitlesByDay: Map<string, string[]>;
  selectedDays: string[];
  restrictPast: boolean;
  onChange: (days: string[]) => void;
  selectionMode?: "multi" | "pick";
  onDayPick?: (day: string) => void;
  monthsToShow?: 1 | 2;
  compact?: boolean;
}

const weekLabels = ["L", "M", "X", "J", "V", "S", "D"];
const monthLabels = [
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

const toIsoDay = (year: number, monthIndex: number, day: number): string =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const toMondayBasedWeekday = (date: Date): number => {
  const sundayBased = date.getUTCDay();
  return sundayBased === 0 ? 6 : sundayBased - 1;
};

interface CalendarCell {
  iso: string | null;
  dayNumber: number | null;
}

const buildMonthCells = (year: number, monthIndex: number): CalendarCell[] => {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leading = toMondayBasedWeekday(first);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < leading; i += 1) {
    cells.push({ iso: null, dayNumber: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      iso: toIsoDay(year, monthIndex, day),
      dayNumber: day,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ iso: null, dayNumber: null });
  }
  return cells;
};

export function DayMultiSelect({
  blockedDays,
  holidayDays,
  pendingDays,
  approvedDays,
  eventTitlesByDay,
  selectedDays,
  restrictPast,
  onChange,
  selectionMode = "multi",
  onDayPick,
  monthsToShow = 2,
  compact = false,
}: DayMultiSelectProps) {
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const [cursorYear, setCursorYear] = useState(now.getUTCFullYear());
  const [cursorMonth, setCursorMonth] = useState(now.getUTCMonth());
  const sorted = useMemo(() => [...selectedDays].sort(), [selectedDays]);
  const selectedSet = useMemo(() => new Set(selectedDays), [selectedDays]);

  const leftMonth = useMemo(
    () => new Date(Date.UTC(cursorYear, cursorMonth, 1)),
    [cursorYear, cursorMonth],
  );
  const rightMonth = useMemo(
    () => new Date(Date.UTC(cursorYear, cursorMonth + 1, 1)),
    [cursorYear, cursorMonth],
  );
  const leftMonthDays = useMemo(
    () => buildMonthCells(leftMonth.getUTCFullYear(), leftMonth.getUTCMonth()),
    [leftMonth],
  );
  const rightMonthDays = useMemo(
    () => buildMonthCells(rightMonth.getUTCFullYear(), rightMonth.getUTCMonth()),
    [rightMonth],
  );

  const moveMonth = (delta: number) => {
    const next = new Date(Date.UTC(cursorYear, cursorMonth + delta, 1));
    setCursorYear(next.getUTCFullYear());
    setCursorMonth(next.getUTCMonth());
  };

  const toggleDay = (isoDay: string) => {
    if (restrictPast && isoDay < todayIso) return;
    if (blockedDays.has(isoDay) || pendingDays.has(isoDay) || approvedDays.has(isoDay)) {
      return;
    }
    if (selectionMode === "pick" && onDayPick) {
      onDayPick(isoDay);
      return;
    }
    if (selectedSet.has(isoDay)) {
      onChange(selectedDays.filter((day) => day !== isoDay));
    } else {
      onChange([...selectedDays, isoDay].sort());
    }
  };

  const renderMonth = (monthDate: Date, cells: CalendarCell[]) => (
    <div className="space-y-4">
      <h3
        className={`text-center font-semibold tracking-tight text-slate-900 ${compact ? "text-2xl" : "text-3xl"}`}
      >
        {monthLabels[monthDate.getUTCMonth()].toLowerCase()}
      </h3>
      <div
        className={`grid grid-cols-7 text-center text-slate-900 ${compact ? "gap-x-2 gap-y-2 text-sm" : "gap-x-4 gap-y-3 text-base"}`}
      >
        {weekLabels.map((label) => (
          <div
            key={`${monthDate.toISOString()}-${label}`}
            className={`font-medium ${compact ? "text-xs" : "text-sm"}`}
          >
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell.iso) {
            return (
              <div
                key={`empty-${monthDate.toISOString()}-${index}`}
                className={compact ? "h-8" : "h-10"}
              />
            );
          }
          const isBlocked = blockedDays.has(cell.iso);
          const isHoliday = holidayDays.has(cell.iso);
          const isPending = pendingDays.has(cell.iso);
          const isApproved = approvedDays.has(cell.iso);
          const isPastDay = restrictPast && cell.iso < todayIso;
          const isSelected = selectedSet.has(cell.iso);
          const isWeekend = (() => {
            const weekday = new Date(`${cell.iso}T00:00:00.000Z`).getUTCDay();
            return weekday === 0 || weekday === 6;
          })();
          const eventTitles = eventTitlesByDay.get(cell.iso) ?? [];
          const title = [cell.iso, ...eventTitles].join(" | ");
          const base =
            compact
              ? "h-8 w-8 justify-self-center rounded-full border text-base font-semibold transition"
              : "h-10 w-10 justify-self-center rounded-full border text-lg font-semibold transition";
          const variant = isHoliday
            ? "cursor-not-allowed border-transparent bg-fuchsia-100 text-fuchsia-700"
            : isBlocked
            ? "cursor-not-allowed border-transparent bg-rose-100 text-rose-600"
            : isApproved
              ? "cursor-not-allowed border-transparent bg-emerald-100 text-emerald-700"
              : isPending
                ? "cursor-not-allowed border-transparent bg-amber-100 text-amber-700"
                : isPastDay
                  ? "cursor-not-allowed border-transparent bg-slate-200 text-slate-400"
                : isSelected
                  ? "border-blue-600 text-blue-600"
                  : isWeekend
                    ? "border-transparent bg-slate-100 text-slate-500 hover:border-slate-300"
                  : "border-transparent text-slate-900 hover:border-slate-300";
          return (
            <button
              key={cell.iso}
              type="button"
              title={title}
              className={`${base} ${variant}`}
              onClick={() => toggleDay(cell.iso!)}
              disabled={isBlocked || isPending || isApproved || isPastDay}
            >
              {cell.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );

  const calendarHeaderLabel =
    monthsToShow === 1
      ? `${monthLabels[leftMonth.getUTCMonth()].toLowerCase()} ${leftMonth.getUTCFullYear()}`
      : `${monthLabels[leftMonth.getUTCMonth()].toLowerCase()} - ${monthLabels[rightMonth.getUTCMonth()].toLowerCase()} ${rightMonth.getUTCFullYear()}`;

  return (
    <div
      className={`space-y-6 rounded-xl border border-slate-200 bg-slate-50 ${compact ? "p-3" : "p-6"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => moveMonth(-1)} type="button" className="px-2">
          {"<"}
        </Button>
        <div className="min-w-0 flex-1 truncate text-center text-sm font-medium text-slate-700">
          {calendarHeaderLabel}
        </div>
        <Button variant="ghost" onClick={() => moveMonth(1)} type="button" className="px-2">
          {">"}
        </Button>
      </div>
      {monthsToShow === 1 ? (
        <div>{renderMonth(leftMonth, leftMonthDays)}</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {renderMonth(leftMonth, leftMonthDays)}
          {renderMonth(rightMonth, rightMonthDays)}
        </div>
      )}

      <div className="text-sm text-slate-600">
        <p>Dias seleccionados: {sorted.length}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sorted.map((day) => (
            <button
              key={day}
              className="rounded bg-slate-100 px-2 py-1 text-xs"
              onClick={() => onChange(selectedDays.filter((entry) => entry !== day))}
              type="button"
            >
              {day}
            </button>
          ))}
          {sorted.length === 0 ? <span>-</span> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="rounded bg-slate-900 px-2 py-1 text-white">Seleccionado</span>
          <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">Bloqueado</span>
          <span className="rounded bg-fuchsia-100 px-2 py-1 text-fuchsia-700">Festivo</span>
          <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">Pendiente</span>
          <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">
            Aprobado
          </span>
          <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">
            Fin de semana
          </span>
        </div>
      </div>
    </div>
  );
}

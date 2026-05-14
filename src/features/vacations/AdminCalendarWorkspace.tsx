import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Table, Toast } from "../../shared/ui";
import { vacationsApi } from "../../modules/vacations/services/vacations.api";
import type {
  CalendarEventRecord,
  DepartmentRecord,
  VacationRequestRecord,
} from "../../modules/vacations/domain/types";

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

const weekLabels = ["L", "M", "X", "J", "V", "S", "D"];

const departmentColorClasses = [
  "bg-red-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-lime-500",
  "bg-orange-500",
  "bg-fuchsia-500",
];

const toMondayBasedWeekday = (date: Date): number => {
  const sundayBased = date.getUTCDay();
  return sundayBased === 0 ? 6 : sundayBased - 1;
};

const toIsoDay = (year: number, monthIndex: number, day: number): string =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

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
    cells.push({ iso: toIsoDay(year, monthIndex, day), dayNumber: day });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ iso: null, dayNumber: null });
  }
  return cells;
};

export function AdminCalendarWorkspace() {
  const [items, setItems] = useState<CalendarEventRecord[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<VacationRequestRecord[]>([]);
  const [includePendingAdmin, setIncludePendingAdmin] = useState(false);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"HOLIDAY" | "EVENT">("HOLIDAY");
  const [scope, setScope] = useState<"GLOBAL" | "DEPARTMENT">("GLOBAL");
  const [departmentId, setDepartmentId] = useState("");
  const [day, setDay] = useState("");
  const [blocksSelection, setBlocksSelection] = useState(false);
  const [cursorYear, setCursorYear] = useState(new Date().getUTCFullYear());
  const [cursorMonth, setCursorMonth] = useState(new Date().getUTCMonth());
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    null,
  );

  const load = async () => {
    const [events, deps, approved, pendingAdmin] = await Promise.all([
      vacationsApi.listCalendarEvents({}),
      vacationsApi.listDepartments(),
      vacationsApi.listAdmin({ status: "APPROVED" }),
      includePendingAdmin ? vacationsApi.listAdmin({ status: "PENDING_ADMIN" }) : Promise.resolve([]),
    ]);
    setItems(events);
    setDepartments(deps);
    const byId = new Map<string, VacationRequestRecord>();
    for (const request of approved) byId.set(request.id, request);
    for (const request of pendingAdmin) byId.set(request.id, request);
    setApprovedRequests([...byId.values()]);
  };

  useEffect(() => {
    void load();
  }, [includePendingAdmin]);

  const createEvent = async () => {
    try {
      await vacationsApi.createCalendarEvent({
        title,
        description,
        type,
        scope,
        departmentId: scope === "DEPARTMENT" ? departmentId : undefined,
        days: day ? [day] : undefined,
        blocksSelection: type === "HOLIDAY" ? true : blocksSelection,
      });
      setToast({ message: "Evento creado.", tone: "success" });
      setTitle("");
      setDescription("");
      setDay("");
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al crear evento",
        tone: "error",
      });
    }
  };

  const monthStart = useMemo(
    () => new Date(Date.UTC(cursorYear, cursorMonth, 1)),
    [cursorYear, cursorMonth],
  );

  const monthCells = useMemo(
    () => buildMonthCells(monthStart.getUTCFullYear(), monthStart.getUTCMonth()),
    [monthStart],
  );

  const departmentColorById = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((department, index) => {
      map.set(
        department.id,
        departmentColorClasses[index % departmentColorClasses.length] ?? "bg-slate-500",
      );
    });
    return map;
  }, [departments]);

  const reservedDepartmentsByDay = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const request of approvedRequests) {
      for (const reservedDay of request.days) {
        const current = map.get(reservedDay) ?? new Set<string>();
        current.add(request.departmentId);
        map.set(reservedDay, current);
      }
    }
    return map;
  }, [approvedRequests]);

  const reservedDayCountByDepartment = useMemo(() => {
    const map = new Map<string, number>();
    for (const departmentsForDay of reservedDepartmentsByDay.values()) {
      for (const depId of departmentsForDay) {
        map.set(depId, (map.get(depId) ?? 0) + 1);
      }
    }
    return map;
  }, [reservedDepartmentsByDay]);

  const moveMonth = (delta: number) => {
    const next = new Date(Date.UTC(cursorYear, cursorMonth + delta, 1));
    setCursorYear(next.getUTCFullYear());
    setCursorMonth(next.getUTCMonth());
  };

  return (
    <section className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-semibold">Calendario: Festivos y Eventos</h1>
      </header>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Dias reservados por departamento</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" type="button" onClick={() => moveMonth(-1)}>
              {"<"}
            </Button>
            <span className="min-w-44 text-center text-sm font-medium text-slate-700">
              {monthLabels[monthStart.getUTCMonth()]} {monthStart.getUTCFullYear()}
            </span>
            <Button variant="ghost" type="button" onClick={() => moveMonth(1)}>
              {">"}
            </Button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includePendingAdmin}
            onChange={(event) => setIncludePendingAdmin(event.target.checked)}
          />
          Incluir también solicitudes pendientes de administración
        </label>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
          {weekLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {monthCells.map((cell, index) => {
            if (!cell.iso) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-16 rounded-md border border-transparent bg-transparent"
                />
              );
            }
            const departmentsForDay = [...(reservedDepartmentsByDay.get(cell.iso) ?? new Set<string>())];
            const isWeekend = (() => {
              const weekday = new Date(`${cell.iso}T00:00:00.000Z`).getUTCDay();
              return weekday === 0 || weekday === 6;
            })();
            return (
              <div
                key={cell.iso}
                className={`min-h-16 rounded-md border p-1 ${
                  isWeekend ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white"
                }`}
                title={
                  departmentsForDay.length
                    ? `${cell.iso}: ${departmentsForDay
                        .map(
                          (depId) =>
                            departments.find((dep) => dep.id === depId)?.name ?? depId,
                        )
                        .join(", ")}`
                    : cell.iso
                }
              >
                <div className="text-xs font-semibold text-slate-700">{cell.dayNumber}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {departmentsForDay.map((depId) => (
                    <span
                      key={`${cell.iso}-${depId}`}
                      className={`inline-block h-2 w-2 rounded-full ${departmentColorById.get(depId) ?? "bg-slate-400"}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid gap-2 pt-1 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <div
              key={department.id}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${departmentColorById.get(department.id) ?? "bg-slate-400"}`}
                />
                <span>{department.name}</span>
              </div>
              <span className="text-xs text-slate-500">
                {reservedDayCountByDepartment.get(department.id) ?? 0} dias
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Input label="Titulo" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input
          label="Descripcion"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input label="Dia" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        <Select
          label="Tipo"
          value={type}
          onChange={(e) => setType(e.target.value as "HOLIDAY" | "EVENT")}
          options={[
            { label: "HOLIDAY", value: "HOLIDAY" },
            { label: "EVENT", value: "EVENT" },
          ]}
        />
        <Select
          label="Scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as "GLOBAL" | "DEPARTMENT")}
          options={[
            { label: "GLOBAL", value: "GLOBAL" },
            { label: "DEPARTMENT", value: "DEPARTMENT" },
          ]}
        />
        <Select
          label="Departamento"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          options={[
            { label: "-", value: "" },
            ...departments.map((dep) => ({ label: dep.name, value: dep.id })),
          ]}
        />
        {type === "EVENT" ? (
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={blocksSelection}
              onChange={(e) => setBlocksSelection(e.target.checked)}
            />
            Bloquea seleccion
          </label>
        ) : null}
      </div>
      <Table headers={["ID", "Titulo", "Tipo", "Scope", "Departamento", "Bloquea", "Dias"]}>
        {items.map((event) => (
          <tr key={event.id} className="border-t border-slate-100">
            <td className="px-4 py-3">{event.id}</td>
            <td className="px-4 py-3">{event.title}</td>
            <td className="px-4 py-3">{event.type}</td>
            <td className="px-4 py-3">{event.scope}</td>
            <td className="px-4 py-3">{event.departmentId ?? "-"}</td>
            <td className="px-4 py-3">{event.blocksSelection ? "Si" : "No"}</td>
            <td className="px-4 py-3">{event.days?.join(", ") ?? "-"}</td>
          </tr>
        ))}
      </Table>
      {toast ? (
        <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />
      ) : null}
      {day ? (
        <div className="fixed inset-x-0 bottom-8 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-xs flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white/95 px-3 py-5 shadow-lg backdrop-blur">
            <Button onClick={() => void createEvent()} type="button">
              Confirmar
            </Button>
            <p className="text-sm text-slate-700">
              Dia seleccionado: <strong>{day}</strong>
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

import type { TimeEntryRecord } from "../../../core/types";
import { formatHours } from "../../../shared/utils/format";

interface WeeklyTotalsProps {
  entries: TimeEntryRecord[];
}

export function WeeklyTotals({ entries }: WeeklyTotalsProps) {
  const totalsByCategory = entries.reduce<Record<string, number>>(
    (acc, entry) => {
      acc[entry.category] = (acc[entry.category] ?? 0) + entry.hours;
      return acc;
    },
    {},
  );

  const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-base font-semibold">Totales semanales</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(totalsByCategory).map(([category, hours]) => (
          <div
            key={category}
            className="rounded-md border border-slate-200 p-3 text-sm"
          >
            <p className="text-slate-500">{category}</p>
            <p className="font-semibold">{formatHours(hours)}</p>
          </div>
        ))}
        <div className="rounded-md border border-slate-300 bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Total general</p>
          <p className="font-semibold">{formatHours(totalHours)}</p>
        </div>
      </div>
    </section>
  );
}

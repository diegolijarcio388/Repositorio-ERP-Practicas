interface ProjectHoursChartItem {
  label: string;
  workedHours: number;
  budgetHours: number | null;
}

interface ProjectHoursComparisonChartProps {
  items: ProjectHoursChartItem[];
}

const WIDTH = 900;
const ROW_HEIGHT = 42;
const TOP_PADDING = 52;
const BOTTOM_PADDING = 32;
const LEFT_PADDING = 44;
const RIGHT_PADDING = 170;

const getMaxValue = (items: ProjectHoursChartItem[], totalBudget: number): number => {
  const values = items.flatMap((item) => [
    item.workedHours,
    item.budgetHours ?? 0,
  ]);
  return Math.max(1, totalBudget, ...values);
};

const buildChartGeometry = (maxValue: number, rowCount: number) => {
  const height = TOP_PADDING + rowCount * ROW_HEIGHT + BOTTOM_PADDING;
  const innerWidth = WIDTH - LEFT_PADDING - RIGHT_PADDING;
  const xAt = (value: number) => LEFT_PADDING + (value / maxValue) * innerWidth;
  const yAt = (rowIndex: number) => TOP_PADDING + rowIndex * ROW_HEIGHT;

  return { height, xAt, yAt };
};

export function ProjectHoursComparisonChart({
  items,
}: ProjectHoursComparisonChartProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">
          Control horas vs presupuesto
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          No hay proyectos asignados para construir la grafica.
        </p>
      </section>
    );
  }

  const totalBudget = items.reduce(
    (acc, item) => acc + (item.budgetHours ?? 0),
    0,
  );
  const totalWorked = items.reduce((acc, item) => acc + item.workedHours, 0);
  const rows: ProjectHoursChartItem[] = [
    {
      label: "TOTAL DISPONIBLE",
      workedHours: totalWorked,
      budgetHours: totalBudget,
    },
    ...items,
  ];
  const maxValue = getMaxValue(items, totalBudget);
  const { height, xAt, yAt } = buildChartGeometry(maxValue, rows.length);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">
          Control horas vs presupuesto
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Horas
            imputadas
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Horas
            presupuestadas
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${height}`} className="min-w-[760px]">
          <line
            x1={LEFT_PADDING}
            y1={TOP_PADDING - 20}
            x2={LEFT_PADDING}
            y2={height - BOTTOM_PADDING + 8}
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {rows.map((item, index) => {
            const rowY = yAt(index);
            const budgetValue = item.budgetHours ?? 0;
            const isTotalRow = index === 0;

            return (
              <g key={`${item.label}-${index}`}>
                <line
                  x1={LEFT_PADDING}
                  y1={rowY}
                  x2={xAt(budgetValue)}
                  y2={rowY}
                  stroke={isTotalRow ? "#10b981" : "#94a3b8"}
                  strokeWidth={isTotalRow ? "3" : "2"}
                  strokeLinecap="round"
                />
                <circle cx={xAt(item.workedHours)} cy={rowY} r="4" fill="#2563eb" />
                {item.budgetHours == null ? null : (
                  <circle cx={xAt(item.budgetHours)} cy={rowY} r="4" fill="#059669" />
                )}
                <text
                  x={WIDTH - RIGHT_PADDING + 8}
                  y={rowY + 4}
                  textAnchor="start"
                  fontSize="11"
                  fill={isTotalRow ? "#0f172a" : "#334155"}
                  fontWeight={isTotalRow ? "700" : "500"}
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          <text x={LEFT_PADDING - 8} y={TOP_PADDING - 16} textAnchor="end" fontSize="11" fill="#475569">
            0h
          </text>
          <text
            x={xAt(maxValue) + 8}
            y={TOP_PADDING - 16}
            textAnchor="start"
            fontSize="11"
            fill="#475569"
          >
            {maxValue.toFixed(0)}h
          </text>
        </svg>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Primera fila: total de horas disponibles del trabajador. El punto azul
        marca horas imputadas y el verde horas disponibles por linea.
      </p>
    </section>
  );
}

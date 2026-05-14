import type { UserSession } from "../../core/types";
import { useEffect, useMemo, useState } from "react";
import { getContainer } from "../../core/di/container";
import { subscribeTimeEntriesChange } from "../../core/time/time-entries-context";
import type { Year } from "../../core/types";
import { getYear, subscribeYearChange } from "../../core/year/year-context";
import { ProjectHoursComparisonChart, TimeFeature } from "../../modules/time";

interface WorkerTimeWorkspaceProps {
  session: UserSession;
}

export function WorkerTimeWorkspace({ session }: WorkerTimeWorkspaceProps) {
  const container = useMemo(() => getContainer(), []);
  const [year, setYear] = useState<Year>(getYear());
  const [chartItems, setChartItems] = useState<
    Array<{ label: string; workedHours: number; budgetHours: number | null }>
  >([]);

  const loadChartData = async (targetYear: number) => {
    const [projects, assignments, entries] = await Promise.all([
      container.projects.listByYear(targetYear),
      container.assignments.listByUser(targetYear, session.email),
      container.timeEntries.listByYear(targetYear),
    ]);

    const assignedProjectIds = new Set(
      assignments.map((assignment) => assignment.projectId),
    );
    const assignedProjects = projects.filter((project) =>
      assignedProjectIds.has(project.id),
    );

    const items = assignedProjects.map((project) => {
      const workedHours = entries
        .filter(
          (entry) =>
            entry.userEmail === session.email && entry.projectId === project.id,
        )
        .reduce((acc, entry) => acc + entry.hours, 0);

      return {
        label: project.code,
        workedHours,
        budgetHours: project.budgetHours,
      };
    });

    setChartItems(items);
  };

  useEffect(() => {
    loadChartData(year);
  }, [year, session.email]);

  useEffect(() => {
    return subscribeTimeEntriesChange((changedYear) => {
      if (changedYear === year) {
        loadChartData(year);
      }
    });
  }, [year, session.email]);

  useEffect(() => subscribeYearChange((nextYear) => setYear(nextYear)), []);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Mi registro de horas</h2>
        <p className="mt-1 text-sm text-slate-600">
          Esta vista solo muestra tus entradas y solo puedes imputar horas en
          proyectos donde estas asignado.
        </p>
      </div>
      <ProjectHoursComparisonChart items={chartItems} />
      <TimeFeature session={session} mode="worker" showAddButton={false} />
    </section>
  );
}

import type { ProjectRecord, TimeEntryRecord } from "../../../core/types";
import { Badge, Table } from "../../../shared/ui";
import { formatShortDate } from "../../../shared/utils/date";
import { formatHours } from "../../../shared/utils/format";

interface TimeEntriesTableProps {
  entries: TimeEntryRecord[];
  projects: ProjectRecord[];
}

const getProjectLabel = (
  projects: ProjectRecord[],
  projectId: string,
): string => {
  const project = projects.find(
    (candidateProject) => candidateProject.id === projectId,
  );
  return project ? `${project.code} - ${project.name}` : projectId;
};

export function TimeEntriesTable({ entries, projects }: TimeEntriesTableProps) {
  return (
    <Table
      headers={[
        "Fecha",
        "Proyecto",
        "Usuario",
        "Categoria",
        "Horas",
        "Descripcion",
      ]}
    >
      {entries.map((entry) => (
        <tr key={entry.id} className="border-t border-slate-100">
          <td className="px-4 py-3">{formatShortDate(entry.date)}</td>
          <td className="px-4 py-3">
            {getProjectLabel(projects, entry.projectId)}
          </td>
          <td className="px-4 py-3">{entry.userEmail}</td>
          <td className="px-4 py-3">
            <Badge>{entry.category}</Badge>
          </td>
          <td className="px-4 py-3">{formatHours(entry.hours)}</td>
          <td className="px-4 py-3">{entry.description}</td>
        </tr>
      ))}
      {entries.length === 0 ? (
        <tr>
          <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
            No hay entradas para la semana seleccionada.
          </td>
        </tr>
      ) : null}
    </Table>
  );
}

import type { ProjectRecord } from "../../../core/types";
import { Badge, Button, Table } from "../../../shared/ui";
import { formatHours } from "../../../shared/utils/format";

interface ProjectsTableProps {
  projects: ProjectRecord[];
  onEdit: (project: ProjectRecord) => void;
  onManageAssignments: (project: ProjectRecord) => void;
}

export function ProjectsTable({
  projects,
  onEdit,
  onManageAssignments,
}: ProjectsTableProps) {
  return (
    <Table headers={["Codigo", "Nombre", "Estado", "Presupuesto", ""]}>
      {projects.map((project) => (
        <tr key={project.id} className="border-t border-slate-100">
          <td className="px-4 py-3 font-medium">{project.code}</td>
          <td className="px-4 py-3">{project.name}</td>
          <td className="px-4 py-3">
            <Badge>{project.status}</Badge>
          </td>
          <td className="px-4 py-3">
            {project.budgetHours == null
              ? "Sin tope"
              : formatHours(project.budgetHours)}
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                onClick={() => onManageAssignments(project)}
              >
                Equipo
              </Button>
              <Button variant="ghost" onClick={() => onEdit(project)}>
                Editar
              </Button>
            </div>
          </td>
        </tr>
      ))}
      {projects.length === 0 ? (
        <tr>
          <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
            No hay proyectos para este filtro.
          </td>
        </tr>
      ) : null}
    </Table>
  );
}

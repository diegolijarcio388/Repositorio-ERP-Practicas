import { useEffect, useMemo, useState } from "react";
import { getContainer } from "../../../core/di/container";
import type {
  AssignmentRole,
  ProjectAssignmentRecord,
  ProjectRecord,
  Year,
} from "../../../core/types";
import { ASSIGNMENT_ROLES } from "../../../core/types";
import { Button, Input, Select, Toast } from "../../../shared/ui";

interface ProjectAssignmentsPanelProps {
  year: Year;
  project: ProjectRecord | null;
}

export function ProjectAssignmentsPanel({
  year,
  project,
}: ProjectAssignmentsPanelProps) {
  const repository = useMemo(() => getContainer().assignments, []);
  const [assignments, setAssignments] = useState<ProjectAssignmentRecord[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignmentRole>("Tecnico");
  const [toast, setToast] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const loadAssignments = async () => {
    if (!project) {
      setAssignments([]);
      return;
    }
    const items = await repository.listByProject(year, project.id);
    setAssignments(items);
  };

  useEffect(() => {
    loadAssignments();
  }, [year, project?.id]);

  const handleAssign = async () => {
    if (!project) return;
    try {
      await repository.assign(year, {
        projectId: project.id,
        userEmail: email,
        role,
      });
      setEmail("");
      await loadAssignments();
      setToast({ tone: "success", message: "Trabajador asignado." });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear la asignacion.";
      setToast({ tone: "error", message });
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!project) return;
    await repository.unassign(year, assignmentId);
    await loadAssignments();
    setToast({ tone: "success", message: "Asignacion eliminada." });
  };

  if (!project) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">Equipo del proyecto</h3>
        <p className="mt-2 text-sm text-slate-500">
          Selecciona un proyecto para gestionar sus trabajadores.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold">
          Equipo asignado: {project.code}
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <Input
            label="Email trabajador"
            type="email"
            placeholder="empleado@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Select
            label="Rol en proyecto"
            value={role}
            onChange={(event) => setRole(event.target.value as AssignmentRole)}
            options={ASSIGNMENT_ROLES.map((candidateRole) => ({
              label: candidateRole,
              value: candidateRole,
            }))}
          />
          <div className="self-end">
            <Button onClick={handleAssign}>Asignar</Button>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{assignment.userEmail}</span>
                <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs">
                  {assignment.role}
                </span>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleUnassign(assignment.id)}
              >
                Quitar
              </Button>
            </div>
          ))}
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay trabajadores asignados para este proyecto.
            </p>
          ) : null}
        </div>
      </section>
      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onDone={() => setToast(null)}
        />
      ) : null}
    </>
  );
}

import { useEffect, useState } from "react";
import { Badge, Button, Modal, Select, Toast } from "../../shared/ui";
import { Input } from "../../shared/ui/Input";
import { projectsApi } from "../../modules/projects/services/projects.api";
import { INTERNAL_CATEGORIES, INTERNAL_CATEGORY_LABELS } from "../../modules/projects/domain/types";
import type {
  InternalTimeEntryRecord,
  ProjectRecord,
  ProjectTimeEntryRecord,
  ProjectWithDetails,
  ProjectWorkerView,
} from "../../modules/projects/domain/types";
import type { UserSession } from "../../core/types";

interface Props {
  session: UserSession;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  EMPTY: "Sin enviar",
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EMPTY: "bg-slate-100 text-slate-700",
};

const today = () => new Date().toISOString().slice(0, 10);

const statusRowClass = (status: string) =>
  status === "REJECTED"
    ? "bg-red-50 hover:bg-red-100/60"
    : status === "PENDING"
      ? "bg-amber-50 hover:bg-amber-100/60"
      : "hover:bg-slate-50";

const formatUiDate = (isoDate: string | null | undefined) => {
  if (!isoDate) return "-";
  const date = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleDateString("es-ES");
};

export function WorkerProjectsWorkspace({ session }: Props) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWorkerView | null>(null);
  const [timeEntries, setTimeEntries] = useState<ProjectTimeEntryRecord[]>([]);
  const [internalEntries, setInternalEntries] = useState<InternalTimeEntryRecord[]>([]);
  const [taskNamesById, setTaskNamesById] = useState<Record<string, string>>({});
  const [hourBagDrafts, setHourBagDrafts] = useState<Record<string, { hours: string }>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const [projectEntryOpen, setProjectEntryOpen] = useState(false);
  const [internalEntryOpen, setInternalEntryOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ProjectTimeEntryRecord | null>(null);
  const [editInternal, setEditInternal] = useState<InternalTimeEntryRecord | null>(null);

  const [entryProjectId, setEntryProjectId] = useState("");
  const [entryHourBagProjectName, setEntryHourBagProjectName] = useState("");
  const [entryTaskId, setEntryTaskId] = useState("");
  const [entryDate, setEntryDate] = useState(today());
  const [entryHours, setEntryHours] = useState("");
  const [entryDesc, setEntryDesc] = useState("");

  const [intCategory, setIntCategory] = useState<(typeof INTERNAL_CATEGORIES)[number]>(INTERNAL_CATEGORIES[0]);
  const [intDate, setIntDate] = useState(today());
  const [intHours, setIntHours] = useState("");
  const [intDesc, setIntDesc] = useState("");
  const [filterDate, setFilterDate] = useState(today().slice(0, 7));
  const [formProjectDetail, setFormProjectDetail] = useState<ProjectWithDetails | null>(null);

  const resetProjectEntryForm = () => {
    setEditEntry(null);
    setEntryProjectId("");
    setEntryHourBagProjectName("");
    setEntryTaskId("");
    setEntryDate(today());
    setEntryHours("");
    setEntryDesc("");
  };

  const resetInternalEntryForm = () => {
    setEditInternal(null);
    setIntCategory(INTERNAL_CATEGORIES[0]);
    setIntDate(today());
    setIntHours("");
    setIntDesc("");
  };

  const loadProjectDetail = async (projectId: string) => {
    const project = await projectsApi.getProject(projectId);
    setSelectedProject(project as unknown as ProjectWorkerView);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [projectList, projectTimeEntries, internalTimeEntries] = await Promise.all([
        projectsApi.listProjects(),
        projectsApi.listProjectTimeEntries({}),
        projectsApi.listInternalTimeEntries({}),
      ]);
      setProjects(projectList);
      setTimeEntries(projectTimeEntries);
      setInternalEntries(internalTimeEntries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProject(null);
      return;
    }
    const currentId = selectedProject?.id;
    const nextId = projects.some((project) => project.id === currentId) ? currentId : projects[0]?.id;
    if (nextId) {
      void loadProjectDetail(nextId).catch(() => {});
    }
  }, [projects]);

  useEffect(() => {
    let cancelled = false;
    const loadTaskNames = async () => {
      const details = await Promise.all(projects.map((project) => projectsApi.getProject(project.id).catch(() => null)));
      if (cancelled) return;
      const nextTaskNames: Record<string, string> = {};
      for (const detail of details) {
        if (!detail) continue;
        for (const workPackage of detail.workPackages) {
          for (const task of workPackage.tasks) {
            nextTaskNames[task.id] = task.isDefault ? "General" : `${workPackage.name} · ${task.name}`;
          }
        }
      }
      setTaskNamesById(nextTaskNames);
    };
    if (projects.length > 0) {
      void loadTaskNames().catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [projects]);

  useEffect(() => {
    if (!entryProjectId) {
      setFormProjectDetail(null);
      return;
    }
    projectsApi
      .getProject(entryProjectId)
      .then((project) => setFormProjectDetail(project))
      .catch(() => {});
  }, [entryProjectId]);

  useEffect(() => {
    if (!selectedProject || selectedProject.hourTrackingMode !== "BOLSA_HORAS") {
      setHourBagDrafts({});
      return;
    }
    const nextDrafts: Record<string, { hours: string }> = {};
    for (const entry of selectedProject.hourBagEntries) {
      nextDrafts[entry.id] = { hours: entry.hours != null ? String(entry.hours) : "" };
    }
    setHourBagDrafts(nextDrafts);
  }, [selectedProject]);

  const openNewProjectEntry = (projectId?: string) => {
    resetProjectEntryForm();
    setEntryProjectId(projectId ?? "");
    setProjectEntryOpen(true);
  };

  const openEditProjectEntry = (entry: ProjectTimeEntryRecord) => {
    setEditEntry(entry);
    setEntryProjectId(entry.projectId);
    setEntryHourBagProjectName("");
    setEntryTaskId(entry.taskId);
    setEntryDate(entry.date);
    setEntryHours(String(entry.hours));
    setEntryDesc(entry.description);
    setProjectEntryOpen(true);
  };

  const openNewInternalEntry = () => {
    resetInternalEntryForm();
    setInternalEntryOpen(true);
  };

  const openEditInternalEntry = (entry: InternalTimeEntryRecord) => {
    setEditInternal(entry);
    setIntCategory(entry.category);
    setIntDate(entry.date);
    setIntHours(String(entry.hours));
    setIntDesc(entry.description);
    setInternalEntryOpen(true);
  };

  const refreshAfterProjectMutation = async (projectId?: string) => {
    await load();
    const nextId = projectId ?? selectedProject?.id;
    if (nextId) {
      await loadProjectDetail(nextId).catch(() => {});
    }
  };

  const handleDeleteProjectEntry = async (id: string) => {
    try {
      await projectsApi.deleteProjectTimeEntry(id);
      setToast({ tone: "success", message: "Entrada eliminada." });
      await refreshAfterProjectMutation();
    } catch {
      setToast({ tone: "error", message: "No se pudo eliminar." });
    }
  };

  const handleDeleteInternalEntry = async (id: string) => {
    try {
      await projectsApi.deleteInternalTimeEntry(id);
      setToast({ tone: "success", message: "Entrada eliminada." });
      await load();
    } catch {
      setToast({ tone: "error", message: "No se pudo eliminar." });
    }
  };

  const handleSaveProjectEntry = async () => {
    const hours = parseFloat(entryHours);
    const project = projects.find((item) => item.id === entryProjectId);
    const isHourBagProject = project?.hourTrackingMode === "BOLSA_HORAS";
    if (!entryProjectId || !entryTaskId || Number.isNaN(hours) || hours <= 0) {
      setToast({ tone: "error", message: "Rellena todos los campos obligatorios." });
      return;
    }
    if (!isHourBagProject && (!entryDate || !entryDesc.trim())) {
      setToast({ tone: "error", message: "La fecha y la descripcion son obligatorias." });
      return;
    }
    try {
      if (isHourBagProject) {
        await projectsApi.workerLogHourBagEntry(entryProjectId, entryTaskId, hours, entryDate || undefined);
        setToast({ tone: "success", message: "Solicitud enviada al coordinador." });
      } else if (editEntry) {
        await projectsApi.updateProjectTimeEntry(editEntry.id, {
          hours,
          description: entryDesc,
          taskId: entryTaskId,
        });
        setToast({ tone: "success", message: "Solicitud actualizada y reenviada al coordinador." });
      } else {
        await projectsApi.createProjectTimeEntry({
          projectId: entryProjectId,
          taskId: entryTaskId,
          date: entryDate,
          hours,
          description: entryDesc,
        });
        setToast({ tone: "success", message: "Solicitud enviada al coordinador." });
      }
      setProjectEntryOpen(false);
      resetProjectEntryForm();
      await refreshAfterProjectMutation(entryProjectId);
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Error al guardar." });
    }
  };

  const handleSaveInternalEntry = async () => {
    const hours = parseFloat(intHours);
    if (!intDate || Number.isNaN(hours) || hours <= 0 || !intDesc.trim()) {
      setToast({ tone: "error", message: "Rellena todos los campos." });
      return;
    }
    try {
      if (editInternal) {
        await projectsApi.updateInternalTimeEntry(editInternal.id, { hours, description: intDesc });
        setToast({ tone: "success", message: "Entrada actualizada." });
      } else {
        await projectsApi.createInternalTimeEntry({
          category: intCategory,
          date: intDate,
          hours,
          description: intDesc,
        });
        setToast({ tone: "success", message: "Horas registradas." });
      }
      setInternalEntryOpen(false);
      resetInternalEntryForm();
      await load();
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Error al guardar." });
    }
  };

  const handleWorkerLogHourBag = async (entryId: string) => {
    if (!selectedProject) return;
    const draft = hourBagDrafts[entryId];
    const hours = parseFloat(draft?.hours ?? "");
    if (Number.isNaN(hours) || hours <= 0) {
      setToast({ tone: "error", message: "Las horas deben ser mayores que cero." });
      return;
    }
    try {
      const updated = await projectsApi.workerLogHourBagEntry(selectedProject.id, entryId, hours);
      setSelectedProject(updated);
      setToast({ tone: "success", message: "Solicitud enviada al coordinador." });
      await load();
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "No se pudo guardar." });
    }
  };

  const filteredProjectEntries = timeEntries.filter((entry) => entry.date.startsWith(filterDate));
  const filteredInternalEntries = internalEntries.filter((entry) => entry.date.startsWith(filterDate));
  const totalProjectHours = filteredProjectEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalInternalHours = filteredInternalEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const pendingProjectEntriesCount = filteredProjectEntries.filter((entry) => entry.reviewStatus === "PENDING").length;
  const rejectedProjectEntries = filteredProjectEntries.filter((entry) => entry.reviewStatus === "REJECTED");
  const pendingHourBagEntriesCount =
    selectedProject?.hourBagEntries.filter((entry) => entry.reviewStatus === "PENDING").length ?? 0;
  const rejectedHourBagEntries =
    selectedProject?.hourBagEntries.filter((entry) => entry.reviewStatus === "REJECTED") ?? [];

  const selectedFormProject = projects.find((project) => project.id === entryProjectId);
  const isHourBagProject = selectedFormProject?.hourTrackingMode === "BOLSA_HORAS";
  const availableTasks = formProjectDetail ? formProjectDetail.workPackages.flatMap((workPackage) => workPackage.tasks) : [];
  const availableHourBagEntries = formProjectDetail?.hourBagEntries ?? [];
  const availableHourBagProjects = Array.from(
    new Set(availableHourBagEntries.map((entry) => entry.externalProjectName?.trim()).filter(Boolean)),
  ) as string[];
  const availableHourBagTasks = availableHourBagEntries.filter(
    (entry) => entry.externalProjectName === entryHourBagProjectName,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Mis proyectos e imputacion de horas</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Registra tus horas y revisa el estado de cada solicitud sin salir de esta pantalla.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNewInternalEntry}>+ Actividad interna</Button>
          <Button onClick={() => openNewProjectEntry(selectedProject?.id)}>+ Horas proyecto</Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-medium">Proyectos asignados</h3>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Cargando...</p>
        ) : projects.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No tienes proyectos asignados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  {["Codigo", "Nombre", "Estado", "Periodo", ""].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const isSelected = selectedProject?.id === project.id;
                  return (
                    <tr
                      key={project.id}
                      className={`border-t border-slate-100 ${isSelected ? "bg-slate-100/80" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-4 py-3 font-mono text-sm font-medium">{project.code}</td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-slate-800">{project.name}</span>
                        {project.clientName && <span className="block text-xs text-slate-500">{project.clientName}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[project.status] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {STATUS_LABELS[project.status] ?? project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatUiDate(project.startDate)} {"->"} {formatUiDate(project.endDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant={isSelected ? "ghost" : "secondary"}
                            onClick={() => void loadProjectDetail(project.id)}
                          >
                            {isSelected ? "Seleccionado" : "Ver detalle"}
                          </Button>
                          <Button onClick={() => openNewProjectEntry(project.id)}>+ Horas</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedProject && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Detalle del proyecto seleccionado</h3>
                <p className="text-sm text-slate-500">
                  {selectedProject.code} - {selectedProject.name}
                </p>
              </div>
              <Button onClick={() => openNewProjectEntry(selectedProject.id)}>+ Horas en este proyecto</Button>
            </div>
          </div>

          <div className="space-y-4 p-4 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 lg:grid-cols-6">
              <div>
                <span className="text-slate-500">Codigo</span>
                <p className="font-mono font-semibold">{selectedProject.code}</p>
              </div>
              <div>
                <span className="text-slate-500">Estado</span>
                <p>{STATUS_LABELS[selectedProject.status] ?? selectedProject.status}</p>
              </div>
              <div>
                <span className="text-slate-500">Inicio</span>
                <p>{formatUiDate(selectedProject.startDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">Fin</span>
                <p>{formatUiDate(selectedProject.endDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">Presupuesto</span>
                <p>{selectedProject.totalBudgetHours ? `${selectedProject.totalBudgetHours}h` : "-"}</p>
              </div>
              <div>
                <span className="text-slate-500">Coordinador</span>
                <p>{selectedProject.managerName || session.displayName}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Estructura del proyecto</h4>
                <span className="text-xs text-slate-500">
                  Las tareas marcadas en verde son las que puedes imputar.
                </span>
              </div>

              {selectedProject.workPackages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Este proyecto no tiene estructura definida.
                </div>
              ) : (
                selectedProject.workPackages.map((workPackage) => (
                  <div key={workPackage.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{workPackage.name}</p>
                        {(workPackage.startDate || workPackage.endDate) && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            {formatUiDate(workPackage.startDate)} {"->"} {formatUiDate(workPackage.endDate)}
                          </p>
                        )}
                      </div>
                      {workPackage.budgetHours != null && <Badge>{workPackage.budgetHours}h presup.</Badge>}
                    </div>

                    <div className="mt-3 grid gap-2">
                      {workPackage.tasks.map((task) => {
                        const canLog = selectedProject.assignedTaskIds.includes(task.id);
                        return (
                          <div
                            key={task.id}
                            className={`rounded-lg border px-3 py-2 ${
                              canLog ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className={canLog ? "font-medium text-green-800" : "font-medium text-slate-700"}>
                                  {task.isDefault ? "General" : task.name}
                                </p>
                                {canLog && (
                                  <p className="text-xs text-green-600">Puedes registrar horas en esta tarea.</p>
                                )}
                              </div>
                              {task.budgetHours != null && (
                                <span className="text-xs text-slate-500">{task.budgetHours}h</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProject?.hourTrackingMode === "BOLSA_HORAS" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="font-medium">Bolsa de horas (tus lineas)</h3>
          </div>
          <div className="space-y-3 p-4">
            {(pendingHourBagEntriesCount > 0 || rejectedHourBagEntries.length > 0) && (
              <div className="space-y-3">
                {pendingHourBagEntriesCount > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Tienes {pendingHourBagEntriesCount} solicitud
                    {pendingHourBagEntriesCount === 1 ? "" : "es"} de bolsa de horas pendiente
                    {pendingHourBagEntriesCount === 1 ? "" : "s"} de revision.
                  </div>
                )}
                {rejectedHourBagEntries.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    Tienes {rejectedHourBagEntries.length} solicitud
                    {rejectedHourBagEntries.length === 1 ? "" : "es"} de bolsa de horas rechazada
                    {rejectedHourBagEntries.length === 1 ? "" : "s"}.
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    {["Proyecto", "Tarea", "BB", "Especializacion", "Area", "Horas", "Estado", "Fecha", ""].map(
                      (header) => (
                        <th key={header} className="px-4 py-3 font-medium">
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedProject.hourBagEntries.map((entry) => (
                    <tr key={entry.id} className={`border-t border-slate-100 ${statusRowClass(entry.reviewStatus)}`}>
                      <td className="px-4 py-2 text-sm">{entry.externalProjectName}</td>
                      <td className="px-4 py-2 text-sm">{entry.taskName}</td>
                      <td className="px-4 py-2 text-sm">{entry.buildingBlock}</td>
                      <td className="px-4 py-2 text-sm">{entry.specialization}</td>
                      <td className="px-4 py-2 text-sm">{entry.area}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={hourBagDrafts[entry.id]?.hours ?? ""}
                          disabled={entry.reviewStatus === "APPROVED"}
                          onChange={(event) =>
                            setHourBagDrafts((current) => ({
                              ...current,
                              [entry.id]: { ...(current[entry.id] ?? { hours: "" }), hours: event.target.value },
                            }))
                          }
                          className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            REVIEW_STATUS_COLORS[entry.reviewStatus] ?? REVIEW_STATUS_COLORS.EMPTY
                          }`}
                        >
                          {REVIEW_STATUS_LABELS[entry.reviewStatus] ?? entry.reviewStatus}
                        </span>
                        {entry.rejectionReason && (
                          <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs leading-5 text-red-700 whitespace-pre-wrap break-words">
                            <span className="mb-1 block font-semibold uppercase tracking-wide text-red-800">
                              Motivo del rechazo
                            </span>
                            {entry.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">{formatUiDate(entry.date)}</td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="secondary"
                          onClick={() => handleWorkerLogHourBag(entry.id)}
                          disabled={entry.reviewStatus === "APPROVED"}
                        >
                          {entry.reviewStatus === "REJECTED" ? "Reenviar" : "Enviar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {selectedProject.hourBagEntries.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                        No hay lineas de bolsa de horas para este proyecto.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="font-medium">Mis imputaciones</h3>
          <input
            type="month"
            value={filterDate}
            onChange={(event) => setFilterDate(event.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </div>

        <div className="space-y-5 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Horas en proyectos</p>
              <p className="mt-1 text-xl font-semibold text-slate-800">{totalProjectHours.toFixed(2)} h</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Horas internas</p>
              <p className="mt-1 text-xl font-semibold text-slate-800">{totalInternalHours.toFixed(2)} h</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Registros del mes</p>
              <p className="mt-1 text-xl font-semibold text-slate-800">
                {filteredProjectEntries.length + filteredInternalEntries.length}
              </p>
            </div>
          </div>

          {(pendingProjectEntriesCount > 0 || rejectedProjectEntries.length > 0) && (
            <div className="space-y-3">
              {pendingProjectEntriesCount > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Tienes {pendingProjectEntriesCount} imputacion
                  {pendingProjectEntriesCount === 1 ? "" : "es"} de proyecto pendiente
                  {pendingProjectEntriesCount === 1 ? "" : "s"} de revision por el coordinador.
                </div>
              )}
              {rejectedProjectEntries.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  Tienes {rejectedProjectEntries.length} imputacion
                  {rejectedProjectEntries.length === 1 ? "" : "es"} de proyecto rechazada
                  {rejectedProjectEntries.length === 1 ? "" : "s"}.
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-700">En proyectos</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    {["Fecha", "Proyecto", "Tarea", "Horas", "Estado", "Descripcion", ""].map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProjectEntries.map((entry) => {
                    const project = projects.find((item) => item.id === entry.projectId);
                    const taskLabel = taskNamesById[entry.taskId] ?? "Tarea asignada";
                    const isApproved = entry.reviewStatus === "APPROVED";
                    return (
                      <tr key={entry.id} className={`border-t border-slate-100 ${statusRowClass(entry.reviewStatus)}`}>
                        <td className="px-4 py-2 text-sm">{formatUiDate(entry.date)}</td>
                        <td className="px-4 py-2 text-sm font-medium">
                          <span className="block">{project?.code ?? "Proyecto"}</span>
                          {project?.name && <span className="block text-xs font-normal text-slate-500">{project.name}</span>}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-700">{taskLabel}</td>
                        <td className="px-4 py-2 text-sm font-semibold">{entry.hours}h</td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${
                              REVIEW_STATUS_COLORS[entry.reviewStatus] ?? REVIEW_STATUS_COLORS.PENDING
                            }`}
                          >
                            {REVIEW_STATUS_LABELS[entry.reviewStatus] ?? entry.reviewStatus}
                          </span>
                        </td>
                        <td className="max-w-xs px-4 py-2 text-sm text-slate-600">
                          <span className="block whitespace-pre-wrap break-words">{entry.description}</span>
                          {entry.rejectionReason && (
                            <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs leading-5 text-red-700 whitespace-pre-wrap break-words">
                              <span className="mb-1 block font-semibold uppercase tracking-wide text-red-800">
                                Motivo del rechazo
                              </span>
                              {entry.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" onClick={() => openEditProjectEntry(entry)} disabled={isApproved}>
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteProjectEntry(entry.id)}
                              disabled={isApproved}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProjectEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Sin imputaciones en proyectos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-700">Actividades internas</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    {["Fecha", "Categoria", "Horas", "Descripcion", ""].map((header) => (
                      <th key={header} className="px-4 py-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInternalEntries.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 text-sm">{formatUiDate(entry.date)}</td>
                      <td className="px-4 py-2 text-sm font-medium">{INTERNAL_CATEGORY_LABELS[entry.category]}</td>
                      <td className="px-4 py-2 text-sm font-semibold">{entry.hours}h</td>
                      <td className="max-w-xs px-4 py-2 text-sm text-slate-600 whitespace-pre-wrap break-words">
                        {entry.description}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" onClick={() => openEditInternalEntry(entry)}>
                            Editar
                          </Button>
                          <Button variant="ghost" onClick={() => handleDeleteInternalEntry(entry.id)}>
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInternalEntries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Sin actividades internas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={projectEntryOpen}
        title={editEntry ? "Editar horas de proyecto" : "Registrar horas en proyecto"}
        onClose={() => {
          setProjectEntryOpen(false);
          resetProjectEntryForm();
        }}
        panelClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <Select
            label="Proyecto"
            value={entryProjectId}
            onChange={(event) => {
              setEntryProjectId(event.target.value);
              setEntryTaskId("");
              setEntryHourBagProjectName("");
            }}
            options={[
              { value: "", label: "Selecciona un proyecto" },
              ...projects.map((project) => ({
                value: project.id,
                label: `${project.code} - ${project.name}`,
              })),
            ]}
          />

          {isHourBagProject ? (
            <>
              <Select
                label="Proyecto de bolsa"
                value={entryHourBagProjectName}
                onChange={(event) => {
                  setEntryHourBagProjectName(event.target.value);
                  setEntryTaskId("");
                }}
                options={[
                  { value: "", label: "Selecciona un proyecto de bolsa" },
                  ...availableHourBagProjects.map((projectName) => ({
                    value: projectName,
                    label: projectName,
                  })),
                ]}
              />
              <Select
                label="Linea de bolsa"
                value={entryTaskId}
                onChange={(event) => setEntryTaskId(event.target.value)}
                options={[
                  { value: "", label: "Selecciona una linea" },
                  ...availableHourBagTasks.map((entry) => ({
                    value: entry.id,
                    label: `${entry.taskName} · ${entry.buildingBlock} · ${entry.area}`,
                  })),
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Fecha"
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                />
                <Input
                  label="Horas"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={entryHours}
                  onChange={(event) => setEntryHours(event.target.value)}
                />
              </div>
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Esta linea se enviara al coordinador para su aprobacion.
              </p>
            </>
          ) : (
            <>
              <Select
                label="Tarea"
                value={entryTaskId}
                onChange={(event) => setEntryTaskId(event.target.value)}
                options={[
                  { value: "", label: "Selecciona una tarea" },
                  ...availableTasks.map((task) => ({
                    value: task.id,
                    label: task.isDefault ? "General" : task.name,
                  })),
                ]}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Fecha"
                  type="date"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                />
                <Input
                  label="Horas"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={entryHours}
                  onChange={(event) => setEntryHours(event.target.value)}
                />
              </div>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-700">Descripcion</span>
                <textarea
                  value={entryDesc}
                  onChange={(event) => setEntryDesc(event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
                  placeholder="Explica el trabajo realizado"
                />
              </label>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setProjectEntryOpen(false);
                resetProjectEntryForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveProjectEntry}>{editEntry ? "Guardar cambios" : "Enviar solicitud"}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={internalEntryOpen}
        title={editInternal ? "Editar actividad interna" : "Nueva actividad interna"}
        onClose={() => {
          setInternalEntryOpen(false);
          resetInternalEntryForm();
        }}
        panelClassName="max-w-xl"
      >
        <div className="space-y-4">
          <Select
            label="Categoria"
            value={intCategory}
            onChange={(event) => setIntCategory(event.target.value as (typeof INTERNAL_CATEGORIES)[number])}
            options={INTERNAL_CATEGORIES.map((category) => ({
              value: category,
              label: INTERNAL_CATEGORY_LABELS[category],
            }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha" type="date" value={intDate} onChange={(event) => setIntDate(event.target.value)} />
            <Input
              label="Horas"
              type="number"
              min="0.1"
              step="0.1"
              value={intHours}
              onChange={(event) => setIntHours(event.target.value)}
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">Descripcion</span>
            <textarea
              value={intDesc}
              onChange={(event) => setIntDesc(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              placeholder="Describe la actividad interna"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setInternalEntryOpen(false);
                resetInternalEntryForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveInternalEntry}>{editInternal ? "Guardar cambios" : "Guardar"}</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast tone={toast.tone} message={toast.message} onDone={() => setToast(null)} />}
    </div>
  );
}

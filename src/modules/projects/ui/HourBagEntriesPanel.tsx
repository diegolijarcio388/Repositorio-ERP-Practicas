import { useMemo, useState } from "react";
import { Button, Input, Table } from "../../../shared/ui";
import type {
  CreateProjectHourBagEntryInput,
  ProjectHourBagEntryRecord,
  ProjectWithDetails,
  UpdateProjectHourBagEntryInput,
} from "../domain/types";
import { projectsApi } from "../services/projects.api";

interface Props {
  project: ProjectWithDetails;
  workerOptions: Array<{ id: string; name: string }>;
  onProjectUpdated: (project: ProjectWithDetails) => void;
  onToast: (payload: { tone: "success" | "error"; message: string }) => void;
}

interface FormState {
  company: string;
  purchaseOrderNumber: string;
  externalProjectName: string;
  taskName: string;
  buildingBlock: string;
  specialization: string;
  area: string;
  assignedUserIds: string[];
  hours: string;
  date: string;
}

const emptyForm = (): FormState => ({
  company: "",
  purchaseOrderNumber: "",
  externalProjectName: "",
  taskName: "",
  buildingBlock: "",
  specialization: "",
  area: "",
  assignedUserIds: [],
  hours: "",
  date: "",
});

const mapEntryToForm = (entry: ProjectHourBagEntryRecord): FormState => ({
  company: entry.company,
  purchaseOrderNumber: entry.purchaseOrderNumber,
  externalProjectName: entry.externalProjectName,
  taskName: entry.taskName,
  buildingBlock: entry.buildingBlock,
  specialization: entry.specialization,
  area: entry.area,
  assignedUserIds: entry.assignedUserId ? [entry.assignedUserId] : [],
  hours: entry.hours != null ? String(entry.hours) : "",
  date: entry.date ?? "",
});

export function HourBagEntriesPanel({ project, workerOptions, onProjectUpdated, onToast }: Props) {
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const sortedEntries = useMemo(
    () => [...project.hourBagEntries].sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`)),
    [project.hourBagEntries],
  );
  const handleSave = async () => {
    const hasHours = form.hours.trim().length > 0;
    const parsedHours = hasHours ? parseFloat(form.hours) : null;
    if (hasHours && (parsedHours == null || Number.isNaN(parsedHours) || parsedHours <= 0)) {
      onToast({ tone: "error", message: "Horas debe ser mayor que cero." });
      return;
    }
    if (!editEntryId && form.assignedUserIds.length === 0) {
      onToast({ tone: "error", message: "Asigna al menos un trabajador." });
      return;
    }

    try {
      if (editEntryId) {
        const payload: UpdateProjectHourBagEntryInput = {
          company: form.company,
          purchaseOrderNumber: form.purchaseOrderNumber,
          externalProjectName: form.externalProjectName,
          taskName: form.taskName,
          buildingBlock: form.buildingBlock,
          specialization: form.specialization,
          area: form.area,
          hours: parsedHours ?? undefined,
          date: form.date.trim() ? form.date : undefined,
        };
        const updated = await projectsApi.updateHourBagEntry(project.id, editEntryId, payload);
        onProjectUpdated(updated);
        onToast({ tone: "success", message: "Línea de bolsa actualizada." });
      } else {
        const payload: CreateProjectHourBagEntryInput = {
          company: form.company,
          purchaseOrderNumber: form.purchaseOrderNumber,
          externalProjectName: form.externalProjectName,
          taskName: form.taskName,
          buildingBlock: form.buildingBlock,
          specialization: form.specialization,
          area: form.area,
          hours: parsedHours,
          date: form.date.trim() ? form.date : null,
        };
        const updated = await projectsApi.addHourBagEntry(project.id, payload, form.assignedUserIds);
        onProjectUpdated(updated);
        onToast({ tone: "success", message: "Línea de bolsa añadida." });
      }
      setForm(emptyForm());
      setEditEntryId(null);
    } catch (error) {
      onToast({ tone: "error", message: error instanceof Error ? error.message : "No se pudo guardar la línea." });
    }
  };

  const handleEdit = (entry: ProjectHourBagEntryRecord) => {
    setEditEntryId(entry.id);
    setForm(mapEntryToForm(entry));
  };

  const handleDelete = async (entry: ProjectHourBagEntryRecord) => {
    const confirmed = window.confirm(`¿Eliminar la línea "${entry.externalProjectName}" del ${entry.date}?`);
    if (!confirmed) return;
    try {
      const updated = await projectsApi.deleteHourBagEntry(project.id, entry.id);
      onProjectUpdated(updated);
      if (editEntryId === entry.id) {
        setEditEntryId(null);
        setForm(emptyForm());
      }
      onToast({ tone: "success", message: "Línea eliminada." });
    } catch (error) {
      onToast({ tone: "error", message: error instanceof Error ? error.message : "No se pudo eliminar la línea." });
    }
  };

  const toggleAssignedUser = (userId: string) => {
    setForm((current) => ({
      ...current,
      assignedUserIds: current.assignedUserIds.includes(userId)
        ? current.assignedUserIds.filter((id) => id !== userId)
        : [...current.assignedUserIds, userId],
    }));
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Bolsa de horas</h4>
        {editEntryId && (
          <Button
            variant="secondary"
            onClick={() => {
              setEditEntryId(null);
              setForm(emptyForm());
            }}
          >
            Cancelar edición
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Empresa" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
        <Input label="Número de Pedido" value={form.purchaseOrderNumber} onChange={(e) => setForm((f) => ({ ...f, purchaseOrderNumber: e.target.value }))} />
        <Input label="Proyecto" value={form.externalProjectName} onChange={(e) => setForm((f) => ({ ...f, externalProjectName: e.target.value }))} />
        <Input label="Tarea" value={form.taskName} onChange={(e) => setForm((f) => ({ ...f, taskName: e.target.value }))} />
        <Input label="Building Block" value={form.buildingBlock} onChange={(e) => setForm((f) => ({ ...f, buildingBlock: e.target.value }))} />
        <Input label="Especialización" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
        <Input label="Área" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} />
        <Input label="Horas" type="number" min="0.1" step="0.1" value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} />
        <Input label="Fecha" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
      </div>

      {!editEntryId && (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Asignar a trabajadores (se crea una línea por trabajador)
          </p>
          {workerOptions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {workerOptions.map((worker) => (
                <label key={worker.id} className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={form.assignedUserIds.includes(worker.id)}
                    onChange={() => toggleAssignedUser(worker.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
                  />
                  <span>{worker.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No hay trabajadores asignados al proyecto.</p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave}>{editEntryId ? "Guardar línea" : "Añadir proyecto"}</Button>
      </div>

      <Table headers={["Empresa", "Nº Pedido", "Proyecto", "Tarea", "BB", "Especialización", "Área", "Recurso", "Horas", "Fecha", ""]}>
        {sortedEntries.map((entry) => (
          <tr key={entry.id} className="border-t border-slate-100">
            <td className="px-4 py-2">{entry.company}</td>
            <td className="px-4 py-2">{entry.purchaseOrderNumber}</td>
            <td className="px-4 py-2">{entry.externalProjectName}</td>
            <td className="px-4 py-2">{entry.taskName}</td>
            <td className="px-4 py-2">{entry.buildingBlock}</td>
            <td className="px-4 py-2">{entry.specialization}</td>
            <td className="px-4 py-2">{entry.area}</td>
            <td className="px-4 py-2">{entry.resourceName}</td>
            <td className="px-4 py-2">{entry.hours}</td>
            <td className="px-4 py-2">{entry.date}</td>
            <td className="px-4 py-2 text-right">
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => handleEdit(entry)}>Editar</Button>
                <Button variant="danger" onClick={() => handleDelete(entry)}>Eliminar</Button>
              </div>
            </td>
          </tr>
        ))}
        {sortedEntries.length === 0 && (
          <tr>
            <td className="px-4 py-4 text-center text-slate-500" colSpan={11}>
              No hay líneas en la bolsa de horas.
            </td>
          </tr>
        )}
      </Table>
    </div>
  );
}

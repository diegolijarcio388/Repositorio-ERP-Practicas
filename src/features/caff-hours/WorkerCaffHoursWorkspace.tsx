import { useEffect, useState } from "react";
import { Button, Input, Modal, Select, Table, Toast } from "../../shared/ui";
import type { UserSession } from "../../core/types";
import {
  CAFF_SECTION_LABELS,
  CAFF_SECTIONS,
  type CaffSection,
  type CaffTimeEntryRecord,
} from "../../modules/caff-hours/domain/types";

interface Props {
  session: UserSession;
}

const today = () => new Date().toISOString().slice(0, 10);
const CAFF_SECTION_DESCRIPTIONS: Record<CaffSection, string> = {
  VARIOS_CAF: "Varios: viajes, visitas de CAFDDS, etc.",
  REUNION_CAF: "Reuniones generales que no pertenecen a un proyecto concreto.",
  INCIDENCIAS_CAF: "Caidas de servidor, conexiones u otras incidencias atribuibles a CAF/CAFDDS.",
};

const req = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Error de API");
  }
  return (await response.json()) as T;
};

export function WorkerCaffHoursWorkspace({ session }: Props) {
  const [entries, setEntries] = useState<CaffTimeEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [filterMonth, setFilterMonth] = useState(today().slice(0, 7));

  const [entryOpen, setEntryOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<CaffTimeEntryRecord | null>(null);
  const [section, setSection] = useState<CaffSection>("VARIOS_CAF");
  const [date, setDate] = useState(today());
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await req<{ items: CaffTimeEntryRecord[] }>(
        `/api/caff-hours?dateFrom=${filterMonth}-01&dateTo=${filterMonth}-31`,
      );
      setEntries(res.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterMonth]);

  const openCreate = () => {
    setEditEntry(null);
    setSection("VARIOS_CAF");
    setDate(today());
    setHours("");
    setDescription("");
    setEntryOpen(true);
  };

  const openEdit = (entry: CaffTimeEntryRecord) => {
    setEditEntry(entry);
    setSection(entry.section);
    setDate(entry.date);
    setHours(String(entry.hours));
    setDescription(entry.description);
    setEntryOpen(true);
  };

  const handleSave = async () => {
    const parsedHours = parseFloat(hours);
    if (!date || Number.isNaN(parsedHours) || !description.trim()) {
      setToast({ tone: "error", message: "Fecha, horas y descripción son obligatorias." });
      return;
    }
    try {
      if (editEntry) {
        await req<{ item: CaffTimeEntryRecord }>("/api/caff-hours", {
          method: "PATCH",
          body: JSON.stringify({
            id: editEntry.id,
            section,
            date,
            hours: parsedHours,
            description,
          }),
        });
        setToast({ tone: "success", message: "Imputación actualizada." });
      } else {
        await req<{ item: CaffTimeEntryRecord }>("/api/caff-hours", {
          method: "POST",
          body: JSON.stringify({
            section,
            date,
            hours: parsedHours,
            description,
          }),
        });
        setToast({ tone: "success", message: "Imputación registrada." });
      }
      setEntryOpen(false);
      await load();
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Error al guardar." });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await req(`/api/caff-hours?id=${id}`, { method: "DELETE" });
      setToast({ tone: "success", message: "Imputación eliminada." });
      await load();
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "Error al eliminar." });
    }
  };

  const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Horas CAFF</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {session.displayName}: registro en VARIOS CAF, REUNION CAF e INCIDENCIAS CAF.
          </p>
        </div>
        <Button onClick={openCreate}>+ Nueva imputación</Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mes</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(event) => setFilterMonth(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="text-sm text-slate-600">
            Total mes: <strong>{totalHours.toFixed(2)}h</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {CAFF_SECTIONS.map((entrySection) => (
          <div key={entrySection} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">{CAFF_SECTION_LABELS[entrySection]}</p>
            <p className="mt-1 text-xs text-slate-500">{CAFF_SECTION_DESCRIPTIONS[entrySection]}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Cargando...</p>
        ) : (
          <Table headers={["Fecha", "Sección", "Horas", "Descripción", ""]}>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 text-sm">{entry.date}</td>
                <td className="px-4 py-2 text-sm font-medium">{CAFF_SECTION_LABELS[entry.section]}</td>
                <td className="px-4 py-2 text-sm font-semibold">{entry.hours}h</td>
                <td className="max-w-xl px-4 py-2 text-sm text-slate-600">{entry.description}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => openEdit(entry)}>Editar</Button>
                    <Button variant="ghost" onClick={() => handleDelete(entry.id)}>Eliminar</Button>
                  </div>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Sin imputaciones de Horas CAFF para este mes.
                </td>
              </tr>
            )}
          </Table>
        )}
      </div>

      <Modal
        open={entryOpen}
        title={editEntry ? "Editar imputación CAFF" : "Nueva imputación CAFF"}
        onClose={() => setEntryOpen(false)}
      >
        <div className="space-y-3 pb-2">
          <Select
            label="Sección"
            value={section}
            onChange={(event) => setSection(event.target.value as CaffSection)}
            options={CAFF_SECTIONS.map((value) => ({ label: CAFF_SECTION_LABELS[value], value }))}
          />
          <Input label="Fecha" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Input
            label="Horas"
            type="number"
            min="0.25"
            max="16"
            step="0.25"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            placeholder="Ej: 2"
          />
          <div>
            <label className="mb-1 block text-sm text-slate-700">Descripción</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe la actividad..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEntryOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editEntry ? "Guardar cambios" : "Registrar"}</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}

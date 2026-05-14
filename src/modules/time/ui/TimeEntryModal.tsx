import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type {
  ProjectRecord,
  TimeCategory,
  TimeEntryInput,
} from "../../../core/types";
import { TIME_CATEGORIES } from "../../../core/types";
import { Button, Input, Modal, Select } from "../../../shared/ui";
import { toIsoDate } from "../../../shared/utils/date";

interface TimeEntryModalProps {
  open: boolean;
  projects: ProjectRecord[];
  defaultUserEmail: string;
  users: string[];
  canSelectUser: boolean;
  onClose: () => void;
  onSave: (input: TimeEntryInput) => Promise<void>;
}

export function TimeEntryModal({
  open,
  projects,
  defaultUserEmail,
  users,
  canSelectUser,
  onClose,
  onSave,
}: TimeEntryModalProps) {
  const firstProjectId = projects[0]?.id ?? "";
  const [projectId, setProjectId] = useState(firstProjectId);
  const [userEmail, setUserEmail] = useState(defaultUserEmail);
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [hours, setHours] = useState("1");
  const [category, setCategory] = useState<TimeCategory>("Analisis");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setProjectId(firstProjectId);
    setUserEmail(defaultUserEmail);
    setDate(toIsoDate(new Date()));
    setHours("1");
    setCategory("Analisis");
    setDescription("");
  }, [defaultUserEmail, firstProjectId, open]);

  const userOptions = useMemo(
    () => users.map((email) => ({ label: email, value: email })),
    [users],
  );

  const categoryOptions = TIME_CATEGORIES.map((item) => ({
    label: item,
    value: item,
  }));

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: `${project.code} - ${project.name}`,
  }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) return;
    setIsSubmitting(true);
    try {
      await onSave({
        projectId,
        userEmail,
        date,
        hours: Number(hours),
        category,
        description,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="Añadir horas" onClose={onClose}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Select
          label="Proyecto"
          options={projectOptions}
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
        />
        {canSelectUser ? (
          <Select
            label="Usuario"
            options={userOptions}
            value={userEmail}
            onChange={(event) => setUserEmail(event.target.value)}
          />
        ) : (
          <Input label="Usuario" value={defaultUserEmail} disabled />
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Fecha"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
          <Input
            label="Horas"
            type="number"
            min={0.25}
            max={12}
            step={0.25}
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            required
          />
        </div>
        <Select
          label="Categoria"
          options={categoryOptions}
          value={category}
          onChange={(event) => setCategory(event.target.value as TimeCategory)}
        />
        <Input
          label="Descripcion"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || !projectId}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

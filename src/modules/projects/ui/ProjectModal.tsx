import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type {
  ProjectRecord,
  ProjectStatus,
  ProjectUpsertInput,
} from "../../../core/types";
import { Button, Input, Modal, Select } from "../../../shared/ui";

interface ProjectModalProps {
  open: boolean;
  project: ProjectRecord | null;
  onClose: () => void;
  onSave: (input: ProjectUpsertInput) => Promise<void>;
}

export function ProjectModal({
  open,
  project,
  onClose,
  onSave,
}: ProjectModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Activo");
  const [budgetHours, setBudgetHours] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!project) {
      setCode("");
      setName("");
      setStatus("Activo");
      setBudgetHours("");
      return;
    }
    setCode(project.code);
    setName(project.name);
    setStatus(project.status);
    setBudgetHours(
      project.budgetHours == null ? "" : String(project.budgetHours),
    );
  }, [project, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSave({
        id: project?.id,
        code,
        name,
        status,
        budgetHours: budgetHours.trim() ? Number(budgetHours) : null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={project ? "Editar proyecto" : "Nuevo proyecto"}
      onClose={onClose}
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input
          label="Codigo (opcional)"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Se genera automaticamente si lo dejas vacio"
        />
        <Input
          label="Nombre"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Estado"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProjectStatus)}
            options={[
              { value: "Activo", label: "Activo" },
              { value: "Pausado", label: "Pausado" },
              { value: "Cerrado", label: "Cerrado" },
            ]}
          />
          <Input
            label="Presupuesto (horas, opcional)"
            type="number"
            min={0.25}
            step={0.25}
            value={budgetHours}
            onChange={(event) => setBudgetHours(event.target.value)}
            placeholder="Sin maximo definido"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

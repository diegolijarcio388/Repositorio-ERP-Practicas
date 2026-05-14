import type { ProjectStatus } from "../../../core/types";
import { Input, Select } from "../../../shared/ui";

interface ProjectFiltersProps {
  search: string;
  status: "all" | ProjectStatus;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | ProjectStatus) => void;
}

export function ProjectFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: ProjectFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Input
        label="Buscar"
        placeholder="Codigo o nombre"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <Select
        label="Estado"
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as "all" | ProjectStatus)
        }
        options={[
          { value: "all", label: "Todos" },
          { value: "Activo", label: "Activo" },
          { value: "Pausado", label: "Pausado" },
          { value: "Cerrado", label: "Cerrado" },
        ]}
      />
    </div>
  );
}

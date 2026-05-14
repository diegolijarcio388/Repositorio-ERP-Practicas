import { useEffect, useMemo, useState } from "react";
import { getContainer } from "../../../core/di/container";
import { getYear, subscribeYearChange } from "../../../core/year/year-context";
import type {
  ProjectRecord,
  ProjectStatus,
  ProjectUpsertInput,
  Year,
} from "../../../core/types";
import { Button, Toast } from "../../../shared/ui";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectModal } from "./ProjectModal";
import { ProjectsTable } from "./ProjectsTable";

interface ProjectsFeatureProps {
  onManageAssignments?: (project: ProjectRecord) => void;
}

export function ProjectsFeature({ onManageAssignments }: ProjectsFeatureProps) {
  const repository = useMemo(() => getContainer().projects, []);
  const [year, setYear] = useState<Year>(getYear());
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(
    null,
  );
  const [toast, setToast] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const loadProjects = async (targetYear: number) => {
    const items = await repository.listByYear(targetYear);
    setProjects(items);
  };

  useEffect(() => {
    loadProjects(year);
  }, [year]);

  useEffect(() => {
    return subscribeYearChange((nextYear) => setYear(nextYear));
  }, []);

  const filteredProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      project.code.toLowerCase().includes(query) ||
      project.name.toLowerCase().includes(query);
    const matchesStatus = status === "all" || project.status === status;
    return matchesSearch && matchesStatus;
  });

  const handleSave = async (input: ProjectUpsertInput) => {
    try {
      await repository.upsert(year, input);
      await loadProjects(year);
      setToast({ tone: "success", message: "Proyecto guardado." });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el proyecto.";
      setToast({ tone: "error", message: errorMessage });
      throw error;
    }
  };

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Proyectos {year}</h2>
          <Button
            onClick={() => {
              setSelectedProject(null);
              setModalOpen(true);
            }}
          >
            Nuevo proyecto
          </Button>
        </div>
        <ProjectFilters
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
        />
        <ProjectsTable
          projects={filteredProjects}
          onEdit={(project) => {
            setSelectedProject(project);
            setModalOpen(true);
          }}
          onManageAssignments={(project) => onManageAssignments?.(project)}
        />
      </section>
      <ProjectModal
        open={isModalOpen}
        project={selectedProject}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
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

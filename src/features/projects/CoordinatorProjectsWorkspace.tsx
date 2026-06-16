import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Input, Modal, Select, Table, Toast } from "../../shared/ui";
import { projectsApi } from "../../modules/projects/services/projects.api";
import { HourBagEntriesPanel } from "../../modules/projects/ui/HourBagEntriesPanel";
import type {
  CreateProjectInput,
  ExpenseRecord,
  HourTrackingMode,
  ProjectHourBagEntryRecord,
  ProjectRecord,
  ProjectTimeEntryRecord,
  ProjectWithDetails,
  UpdateProjectInput,
} from "../../modules/projects/domain/types";
import type { UserSession } from "../../core/types";
import { formatDate } from "../../shared/utils/date";

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
const BUILDING_BLOCK_OPTIONS = [
  { code: "BB_A", label: "BB_A" },
  { code: "BB_ALL", label: "BB_all" },
  { code: "BB_B", label: "BB_B" },
  { code: "BB_C", label: "BB_C" },
  { code: "BB_D", label: "BB_D" },
  { code: "BB_E", label: "BB_E" },
  { code: "BB_F", label: "BB_F" },
  { code: "BB_G", label: "BB_G" },
  { code: "BB_H", label: "BB_H" },
  { code: "BB_J", label: "BB_J" },
  { code: "BB_K", label: "BB_K" },
  { code: "BB_L", label: "BB_L" },
  { code: "BB_T", label: "BB_T" },
  { code: "DM_MAQUETAS", label: "DM_MAQUETAS" },
  { code: "REHABILITACIONES", label: "REHABILITACIONES" },
  { code: "VARIOS CALIDAD HOM. SOP. INGENIERIA", label: "VARIOS CALIDAD HOM. SOP. INGENIERIA" },
  { code: "VARIOS GESTIÓN CONFIGURACIÓN", label: "VARIOS GESTIÓN CONFIGURACIÓN" },
] as const;
const BUILDING_BLOCK_CODES = BUILDING_BLOCK_OPTIONS.map((option) => option.code);
const BUILDING_BLOCK_TASK_OPTIONS = [
  "Anteproyecto",
  "Cálculo uniones atornilladas",
  "Diseño 2D",
  "Diseño 3D",
  "Diseño pictogramas",
  "Diseño vinilos",
  "Documentación",
  "Eplan. Desarrollo de cableado",
  "Estudios de ergonomía",
  "Fabricación/Seguimiento Maquetas",
  "Gestión de la configuración",
  "Gestión de requisitos",
  "Gestión documentación proveedor (SAP)",
  "Inscripciones Exterior",
  "Inscripciones Interior",
  "LCA (Life Cycle Assessment)/EPD (Evironmental Produt Declaration)/Ecodesign",
  "Mentor. Desarrollo de cableados",
  "Ofertas",
  "Procedimientos de Pintura",
  "Renderizado",
  "Reunión CAF",
  "STT",
  "Validación de sistemas de pintura",
  "Validar libro de diseño",
] as const;
const normalizeTaskName = (name: string) => name.trim().toUpperCase();
const BUILDING_BLOCK_TASK_SET = new Set(BUILDING_BLOCK_TASK_OPTIONS.map(normalizeTaskName));

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string;
}

interface ProjectFormState {
  code: string;
  name: string;
  hasClient: boolean;
  clientName: string;
  startDate: string;
  endDate: string;
  totalBudgetHours: string;
  hourTrackingMode: HourTrackingMode;
}

interface TaskDraft {
  tempId: string;
  name: string;
  budgetHours: string;
  startDate: string;
  endDate: string;
  assignedUserIds: string[];
}

interface WorkPackageDraft {
  tempId: string;
  name: string;
  budgetHours: string;
  startDate: string;
  endDate: string;
  tasks: TaskDraft[];
}

const defaultFormState = (): ProjectFormState => ({
  code: "",
  name: "",
  hasClient: false,
  clientName: "",
  startDate: "",
  endDate: "",
  totalBudgetHours: "",
  hourTrackingMode: "GENERAL",
});

const draftId = () => Math.random().toString(36).slice(2, 10);
const createTaskDraft = (): TaskDraft => ({ tempId: draftId(), name: "", budgetHours: "", startDate: "", endDate: "", assignedUserIds: [] });
const createBuildingBlockTaskDraft = (workPackageTempId: string, taskName: string): TaskDraft => ({
  tempId: `${workPackageTempId}::${normalizeTaskName(taskName)}`,
  name: taskName,
  budgetHours: "",
  startDate: "",
  endDate: "",
  assignedUserIds: [],
});
const createWorkPackageDraft = (): WorkPackageDraft => ({
  tempId: draftId(),
  name: "",
  budgetHours: "",
  startDate: "",
  endDate: "",
  tasks: [createTaskDraft()],
});

export function CoordinatorProjectsWorkspace({ session }: Props) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<DirectoryUser[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(null);
  const [projectEntries, setProjectEntries] = useState<ProjectTimeEntryRecord[]>([]);
  const [pendingHourBagEntries, setPendingHourBagEntries] = useState<ProjectHourBagEntryRecord[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"projects" | "hours" | "expenses">("projects");

  // Project detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>(defaultFormState());
  const [workPackagesDraft, setWorkPackagesDraft] = useState<WorkPackageDraft[]>([]);
  const [assignedUserIdsDraft, setAssignedUserIdsDraft] = useState<string[]>([]);
  const [activeBuildingBlock, setActiveBuildingBlock] = useState<string>(BUILDING_BLOCK_CODES[0] ?? "");

  // Expense review modal
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseTarget, setExpenseTarget] = useState<ExpenseRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [timeEntryReviewTarget, setTimeEntryReviewTarget] = useState<ProjectTimeEntryRecord | null>(null);
  const [timeEntryRejectReason, setTimeEntryRejectReason] = useState("");
  const [hourBagReviewTarget, setHourBagReviewTarget] = useState<ProjectHourBagEntryRecord | null>(null);
  const [hourBagRejectReason, setHourBagRejectReason] = useState("");

  // Hours filter
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterTaskName, setFilterTaskName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [ps, expenses, usersRes] = await Promise.all([
        projectsApi.listProjects(),
        projectsApi.listPendingExpenses(),
        fetch("/api/directory/users").then((r) => r.json()),
      ]);
      setProjects(ps);
      setPendingExpenses(expenses);
      setDepartmentUsers((usersRes.items ?? []) as DirectoryUser[]);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    const [entries, hourBagProjects] = await Promise.all([
      projectsApi.listProjectTimeEntries({
        projectId: filterProjectId || undefined,
        taskName: filterTaskName.trim() || undefined,
        dateFrom: filterDate ? `${filterDate}-01` : undefined,
        dateTo: filterDate ? `${filterDate}-31` : undefined,
      }),
      Promise.all(
        projects
          .filter((project) => project.hourTrackingMode === "BOLSA_HORAS")
          .filter((project) => !filterProjectId || project.id === filterProjectId)
          .map((project) => projectsApi.getProject(project.id).catch(() => null)),
      ),
    ]);

    const dateFrom = filterDate ? `${filterDate}-01` : "";
    const dateTo = filterDate ? `${filterDate}-31` : "";
    const nextPendingHourBagEntries = hourBagProjects
      .flatMap((project) => project?.hourBagEntries ?? [])
      .filter((entry) => entry.reviewStatus === "PENDING")
      .filter((entry) =>
        filterTaskName.trim()
          ? `${entry.externalProjectName} ${entry.taskName} ${entry.buildingBlock}`
              .toLocaleLowerCase("es")
              .includes(filterTaskName.trim().toLocaleLowerCase("es"))
          : true,
      )
      .filter((entry) => (dateFrom ? (entry.date ?? "") >= dateFrom : true))
      .filter((entry) => (dateTo ? (entry.date ?? "") <= dateTo : true));

    setProjectEntries(entries);
    setPendingHourBagEntries(nextPendingHourBagEntries);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (activeTab === "hours") loadEntries(); }, [activeTab, filterProjectId, filterTaskName, filterDate, projects]);

  useEffect(() => {
    const validUserIds = new Set(departmentUsers.filter((u) => u.role === "worker").map((u) => u.id));
    setAssignedUserIdsDraft((current) => current.filter((id) => validUserIds.has(id)));
    setWorkPackagesDraft((current) =>
      current.map((wp) => ({
        ...wp,
        tasks: wp.tasks.map((task) => ({
          ...task,
          assignedUserIds: task.assignedUserIds.filter((id) => validUserIds.has(id)),
        })),
      })),
    );
  }, [departmentUsers]);

  useEffect(() => {
    if (form.hourTrackingMode === "GENERAL" || form.hourTrackingMode === "BOLSA_HORAS") {
      setWorkPackagesDraft([]);
    } else if (form.hourTrackingMode === "BUILDING_BLOCK") {
      setWorkPackagesDraft([]);
      setActiveBuildingBlock(BUILDING_BLOCK_CODES[0] ?? "");
    }
  }, [form.hourTrackingMode]);
  useEffect(() => {
    if (form.hourTrackingMode !== "BUILDING_BLOCK") return;
    const exists = workPackagesDraft.some((wp) => wp.name.trim().toUpperCase() === activeBuildingBlock);
    if (!exists) {
      const firstSelected = workPackagesDraft[0]?.name?.trim().toUpperCase();
      setActiveBuildingBlock(firstSelected ?? BUILDING_BLOCK_CODES[0] ?? "");
    }
  }, [form.hourTrackingMode, workPackagesDraft, activeBuildingBlock]);

  const workerCandidates = departmentUsers.filter((u) => u.role === "worker");
  const selectedProjectHourBagWorkerOptions = useMemo(() => {
    if (!selectedProject) return [];
    const selectedManagerDepartmentId = departmentUsers.find((u) => u.id === selectedProject.managerId)?.departmentId;
    if (!selectedManagerDepartmentId) return [];
    return departmentUsers
      .filter((u) =>
        u.role === "worker" &&
        u.departmentId === selectedManagerDepartmentId &&
        selectedProject.assignedUserIds.includes(u.id))
      .map((u) => ({ id: u.id, name: u.name }));
  }, [departmentUsers, selectedProject]);

  const openCreate = () => {
    setEditProjectId(null);
    setForm(defaultFormState());
    setWorkPackagesDraft([]);
    setAssignedUserIdsDraft([]);
    setActiveBuildingBlock(BUILDING_BLOCK_CODES[0] ?? "");
    setFormOpen(true);
  };

  const openEdit = (project: ProjectRecord) => {
    setEditProjectId(project.id);
    setForm({
      code: project.code,
      name: project.name,
      hasClient: project.clientName != null,
      clientName: project.clientName ?? "",
      startDate: project.startDate ?? "",
      endDate: project.endDate ?? "",
      totalBudgetHours: project.totalBudgetHours != null ? String(project.totalBudgetHours) : "",
      hourTrackingMode: project.hourTrackingMode,
    });
    setWorkPackagesDraft([]);
    setAssignedUserIdsDraft([]);
    setActiveBuildingBlock(BUILDING_BLOCK_CODES[0] ?? "");
    setFormOpen(true);
  };

  const toggleAssignedUser = (userId: string) => {
    const isRemoving = assignedUserIdsDraft.includes(userId);
    setAssignedUserIdsDraft((current) =>
      isRemoving ? current.filter((id) => id !== userId) : [...current, userId],
    );
    if (isRemoving) {
      setWorkPackagesDraft((current) =>
        current.map((wp) => ({
          ...wp,
          tasks: wp.tasks.map((task) => ({
            ...task,
            assignedUserIds: task.assignedUserIds.filter((id) => id !== userId),
          })),
        })),
      );
    }
  };

  const toggleTaskAssignment = (workPackageTempId: string, taskTempId: string, userId: string) => {
    setWorkPackagesDraft((current) =>
      current.map((wp) =>
        wp.tempId !== workPackageTempId
          ? wp
          : {
              ...wp,
              tasks: wp.tasks.map((task) =>
                task.tempId !== taskTempId
                  ? task
                  : {
                      ...task,
                      assignedUserIds: task.assignedUserIds.includes(userId)
                        ? task.assignedUserIds.filter((id) => id !== userId)
                        : [...task.assignedUserIds, userId],
                    },
              ),
            },
      ),
    );
  };

  const addWorkPackageDraft = () => {
    setWorkPackagesDraft((current) => [...current, createWorkPackageDraft()]);
  };

  const removeWorkPackageDraft = (workPackageTempId: string) => {
    setWorkPackagesDraft((current) => current.filter((wp) => wp.tempId !== workPackageTempId));
  };

  const updateWorkPackageDraft = (
    workPackageTempId: string,
    field: "name" | "budgetHours" | "startDate" | "endDate",
    value: string,
  ) => {
    setWorkPackagesDraft((current) =>
      current.map((wp) => (wp.tempId === workPackageTempId ? { ...wp, [field]: value } : wp)),
    );
  };

  const addTaskDraft = (workPackageTempId: string) => {
    setWorkPackagesDraft((current) =>
      current.map((wp) =>
        wp.tempId === workPackageTempId ? { ...wp, tasks: [...wp.tasks, createTaskDraft()] } : wp,
      ),
    );
  };

  const removeTaskDraft = (workPackageTempId: string, taskTempId: string) => {
    setWorkPackagesDraft((current) =>
      current.map((wp) =>
        wp.tempId === workPackageTempId
          ? { ...wp, tasks: wp.tasks.filter((task) => task.tempId !== taskTempId) }
          : wp,
      ),
    );
  };

  const updateTaskDraft = (
    workPackageTempId: string,
    taskTempId: string,
    field: "name" | "budgetHours" | "startDate" | "endDate",
    value: string,
  ) => {
    setWorkPackagesDraft((current) =>
      current.map((wp) =>
        wp.tempId === workPackageTempId
          ? {
              ...wp,
              tasks: wp.tasks.map((task) =>
                task.tempId === taskTempId ? { ...task, [field]: value } : task,
              ),
            }
          : wp,
      ),
    );
  };

  const toggleBuildingBlockSelection = (bbCode: string, checked: boolean) => {
    setWorkPackagesDraft((current) => {
      const normalizedCode = bbCode.trim().toUpperCase();
      const exists = current.find((wp) => wp.name.trim().toUpperCase() === normalizedCode);
      if (checked) {
        if (exists) return current;
        const next = [...current, { ...createWorkPackageDraft(), name: normalizedCode, tasks: [] }];
        return next.sort(
          (a, b) =>
            BUILDING_BLOCK_CODES.findIndex((code) => code === a.name.trim().toUpperCase()) -
            BUILDING_BLOCK_CODES.findIndex((code) => code === b.name.trim().toUpperCase()),
        );
      }
      if (!exists) return current;
      return current.filter((wp) => wp.tempId !== exists.tempId);
    });
    if (checked) setActiveBuildingBlock(bbCode);
  };

  const toggleBuildingBlockTask = (workPackageTempId: string, taskName: string, checked: boolean) => {
    const normalizedTaskName = normalizeTaskName(taskName);
    setWorkPackagesDraft((current) =>
      current.map((wp) => {
        if (wp.tempId !== workPackageTempId) return wp;
        const existingTask = wp.tasks.find((task) => normalizeTaskName(task.name) === normalizedTaskName);
        if (checked) {
          if (existingTask) return wp;
          return { ...wp, tasks: [...wp.tasks, createBuildingBlockTaskDraft(wp.tempId, taskName)] };
        }
        if (!existingTask) return wp;
        return { ...wp, tasks: wp.tasks.filter((task) => task.tempId !== existingTask.tempId) };
      }),
    );
  };

  const handleSaveProject = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setToast({ tone: "error", message: "Código y nombre son obligatorios." });
      return;
    }
    if (editProjectId) {
      try {
        const input: UpdateProjectInput = {
          code: form.code,
          name: form.name,
          clientName: form.hasClient && form.clientName.trim() ? form.clientName.trim() : null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          totalBudgetHours: form.totalBudgetHours ? parseFloat(form.totalBudgetHours) : null,
        };
        await projectsApi.updateProject(editProjectId, input);
        setToast({ tone: "success", message: "Proyecto actualizado." });
        setFormOpen(false);
        await load();
      } catch (e) {
        setToast({ tone: "error", message: e instanceof Error ? e.message : "Error al actualizar proyecto." });
      }
      return;
    }
    if (form.hourTrackingMode === "STRUCTURED") {
      if (workPackagesDraft.length === 0) {
        setToast({ tone: "error", message: "Añade al menos un paquete de trabajo." });
        return;
      }
      for (const wp of workPackagesDraft) {
        if (!wp.name.trim()) {
          setToast({ tone: "error", message: "Todos los paquetes deben tener nombre." });
          return;
        }
        if (wp.startDate && wp.endDate && wp.startDate > wp.endDate) {
          setToast({ tone: "error", message: `Rango de fechas inválido en el paquete "${wp.name}".` });
          return;
        }
        if (wp.tasks.length === 0) {
          setToast({ tone: "error", message: `El paquete "${wp.name}" debe tener al menos una tarea.` });
          return;
        }
        for (const task of wp.tasks) {
          if (!task.name.trim()) {
            setToast({ tone: "error", message: `Todas las tareas del paquete "${wp.name}" deben tener nombre.` });
            return;
          }
          if (task.startDate && task.endDate && task.startDate > task.endDate) {
            setToast({ tone: "error", message: `Rango de fechas inválido en la tarea "${task.name}".` });
            return;
          }
        }
      }
    } else if (form.hourTrackingMode === "BUILDING_BLOCK") {
      if (workPackagesDraft.length === 0) {
        setToast({ tone: "error", message: "Selecciona al menos un Building Block para el proyecto." });
        return;
      }
      const byName = new Map(workPackagesDraft.map((wp) => [wp.name.trim().toUpperCase(), wp] as const));
      for (const name of byName.keys()) {
        if (!BUILDING_BLOCK_CODES.includes(name as (typeof BUILDING_BLOCK_CODES)[number])) {
          setToast({ tone: "error", message: `Building Block no válido: ${name}.` });
          return;
        }
      }
      for (const wp of workPackagesDraft) {
        const bbName = wp.name.trim().toUpperCase();
        if (wp.tasks.length === 0) {
          setToast({ tone: "error", message: `${bbName} debe tener al menos una tarea.` });
          return;
        }
        for (const task of wp.tasks) {
          if (!task.name.trim()) {
            setToast({ tone: "error", message: `Todas las tareas de ${bbName} deben tener nombre.` });
            return;
          }
          if (!BUILDING_BLOCK_TASK_SET.has(normalizeTaskName(task.name))) {
            setToast({ tone: "error", message: `La tarea "${task.name}" no está permitida en Building Block.` });
            return;
          }
        }
      }
    }
    try {
      const normalizedByName = new Map(
        workPackagesDraft.map((wp) => [wp.name.trim().toUpperCase(), wp] as const),
      );
      const orderedBuildingBlocks = BUILDING_BLOCK_CODES.map((bbName) => normalizedByName.get(bbName)).filter(Boolean) as WorkPackageDraft[];
      const input: CreateProjectInput = {
        code: form.code,
        name: form.name,
        clientName: form.hasClient && form.clientName.trim() ? form.clientName.trim() : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        totalBudgetHours: form.totalBudgetHours ? parseFloat(form.totalBudgetHours) : null,
        hourTrackingMode: form.hourTrackingMode,
        managerId: "",
        assignedUserIds: assignedUserIdsDraft,
        workPackages:
          form.hourTrackingMode === "STRUCTURED"
            ? workPackagesDraft.map((wp, wpIndex) => ({
                name: wp.name.trim(),
                budgetHours: wp.budgetHours ? parseFloat(wp.budgetHours) : null,
                startDate: wp.startDate || null,
                endDate: wp.endDate || null,
                position: wpIndex + 1,
                tasks: wp.tasks.map((task, taskIndex) => ({
                  name: task.name.trim(),
                  budgetHours: task.budgetHours ? parseFloat(task.budgetHours) : null,
                  startDate: task.startDate || null,
                  endDate: task.endDate || null,
                  position: taskIndex + 1,
                })),
              }))
            : form.hourTrackingMode === "BUILDING_BLOCK"
            ? orderedBuildingBlocks.map((wp, wpIndex) => ({
                name: wp.name.trim().toUpperCase(),
                budgetHours: wp.budgetHours ? parseFloat(wp.budgetHours) : null,
                startDate: wp.startDate || null,
                endDate: wp.endDate || null,
                position: wpIndex + 1,
                tasks: wp.tasks.map((task, taskIndex) => ({
                  name: task.name.trim(),
                  budgetHours: task.budgetHours ? parseFloat(task.budgetHours) : null,
                  startDate: task.startDate || null,
                  endDate: task.endDate || null,
                  position: taskIndex + 1,
                })),
              }))
            : undefined,
      };
      const created = await projectsApi.createProject(input);

      if (
        (form.hourTrackingMode === "STRUCTURED" || form.hourTrackingMode === "BUILDING_BLOCK") &&
        assignedUserIdsDraft.length > 0
      ) {
        const assignmentCalls: Promise<unknown>[] = [];
        if (form.hourTrackingMode === "BUILDING_BLOCK") {
          const createdWpByName = new Map(
            created.workPackages.map((wp) => [wp.name.trim().toUpperCase(), wp] as const),
          );
          workPackagesDraft.forEach((wpDraft) => {
            const createdWp = createdWpByName.get(wpDraft.name.trim().toUpperCase());
            if (!createdWp) return;
            const createdTaskByName = new Map(
              createdWp.tasks.map((task) => [normalizeTaskName(task.name), task] as const),
            );
            wpDraft.tasks.forEach((taskDraft) => {
              const createdTask = createdTaskByName.get(normalizeTaskName(taskDraft.name));
              if (!createdTask) return;
              taskDraft.assignedUserIds.forEach((assignedUserId) => {
                assignmentCalls.push(projectsApi.assignUserToTask(created.id, createdTask.id, assignedUserId));
              });
            });
          });
        } else {
          workPackagesDraft.forEach((wpDraft, wpIndex) => {
            const createdWp = created.workPackages[wpIndex];
            if (!createdWp) return;
            wpDraft.tasks.forEach((taskDraft, taskIndex) => {
              const createdTask = createdWp.tasks[taskIndex];
              if (!createdTask) return;
              taskDraft.assignedUserIds.forEach((assignedUserId) => {
                assignmentCalls.push(projectsApi.assignUserToTask(created.id, createdTask.id, assignedUserId));
              });
            });
          });
        }
        if (assignmentCalls.length > 0) await Promise.all(assignmentCalls);
      }

      setToast({ tone: "success", message: "Proyecto creado." });
      setFormOpen(false);
      await load();
    } catch (e) {
      setToast({ tone: "error", message: e instanceof Error ? e.message : "Error al guardar proyecto." });
    }
  };

  const openProjectDetail = async (projectId: string) => {
    try {
      const detail = await projectsApi.getProject(projectId);
      setSelectedProject(detail);
      setDetailOpen(true);
    } catch {
      setToast({ tone: "error", message: "No se pudo cargar el proyecto." });
    }
  };

  const handleDeleteProject = async (project: ProjectRecord) => {
    const confirmed = window.confirm(`¿Seguro que quieres eliminar el proyecto "${project.code}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    try {
      await projectsApi.deleteProject(project.id);
      if (selectedProject?.id === project.id) {
        setDetailOpen(false);
        setSelectedProject(null);
      }
      if (editProjectId === project.id) {
        setFormOpen(false);
        setEditProjectId(null);
      }
      setToast({ tone: "success", message: "Proyecto eliminado." });
      await load();
      if (activeTab === "hours") {
        await loadEntries();
      }
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "No se pudo eliminar el proyecto.",
      });
    }
  };

  const handleApproveExpense = async (id: string) => {
    try {
      await projectsApi.approveExpense(id);
      setToast({ tone: "success", message: "Gasto aprobado." });
      setExpenseOpen(false);
      await load();
    } catch (e) {
      setToast({ tone: "error", message: e instanceof Error ? e.message : "Error." });
    }
  };

  const handleRejectExpense = async (id: string) => {
    if (!rejectReason.trim()) {
      setToast({ tone: "error", message: "Indica el motivo del rechazo." });
      return;
    }
    try {
      await projectsApi.rejectExpense(id, rejectReason);
      setToast({ tone: "success", message: "Gasto rechazado." });
      setExpenseOpen(false);
      setRejectReason("");
      await load();
    } catch (e) {
      setToast({ tone: "error", message: e instanceof Error ? e.message : "Error." });
    }
  };

  const handleApproveProjectTimeEntry = async (id: string) => {
    try {
      await projectsApi.approveProjectTimeEntry(id);
      setToast({ tone: "success", message: "Horas aprobadas." });
      setTimeEntryReviewTarget(null);
      setTimeEntryRejectReason("");
      await loadEntries();
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "No se pudo aprobar." });
    }
  };

  const handleRejectProjectTimeEntry = async (id: string) => {
    if (!timeEntryRejectReason.trim()) {
      setToast({ tone: "error", message: "Indica el motivo del rechazo." });
      return;
    }
    try {
      await projectsApi.rejectProjectTimeEntry(id, timeEntryRejectReason);
      setToast({ tone: "success", message: "Horas rechazadas." });
      setTimeEntryReviewTarget(null);
      setTimeEntryRejectReason("");
      await loadEntries();
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "No se pudo rechazar." });
    }
  };

  const handleApproveHourBagEntry = async (projectId: string, entryId: string) => {
    try {
      await projectsApi.approveHourBagEntry(projectId, entryId);
      setToast({ tone: "success", message: "Horas de bolsa aprobadas." });
      setHourBagReviewTarget(null);
      setHourBagRejectReason("");
      await loadEntries();
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "No se pudo aprobar." });
    }
  };

  const handleRejectHourBagEntry = async (projectId: string, entryId: string) => {
    if (!hourBagRejectReason.trim()) {
      setToast({ tone: "error", message: "Indica el motivo del rechazo." });
      return;
    }
    try {
      await projectsApi.rejectHourBagEntry(projectId, entryId, hourBagRejectReason);
      setToast({ tone: "success", message: "Horas de bolsa rechazadas." });
      setHourBagReviewTarget(null);
      setHourBagRejectReason("");
      await loadEntries();
    } catch (error) {
      setToast({ tone: "error", message: error instanceof Error ? error.message : "No se pudo rechazar." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Gestión de Proyectos</h2>
          <p className="mt-0.5 text-sm text-slate-500">Panel del responsable — proyectos, horas del equipo y gastos.</p>
        </div>
        <div className="flex flex-col gap-2 min-[420px]:flex-row sm:shrink-0 sm:items-center">
          {pendingExpenses.length > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              {pendingExpenses.length} gasto{pendingExpenses.length > 1 ? "s" : ""} pendiente{pendingExpenses.length > 1 ? "s" : ""}
            </span>
          )}
          <Button onClick={openCreate}>+ Nuevo proyecto</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {(["projects", "hours", "expenses"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {tab === "projects" ? "Proyectos" : tab === "hours" ? "Control de horas" : `Gastos${pendingExpenses.length > 0 ? ` (${pendingExpenses.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* Tab: projects */}
      {activeTab === "projects" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-5 text-sm text-slate-500">Cargando...</p>
          ) : (
            <Table headers={["Código", "Nombre", "Cliente", "Estado", "Período", "Presup. h.", ""]}>
              {projects.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{p.code}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">
                    {p.clientName ? <Badge>{p.clientName}</Badge> : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? ""}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(p.startDate)} – {formatDate(p.endDate)}</td>
                  <td className="px-4 py-3 text-sm">{p.totalBudgetHours != null ? `${p.totalBudgetHours}h` : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openProjectDetail(p.id)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Detalle"
                        aria-label={`Ver detalle de ${p.code}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Editar"
                        aria-label={`Editar ${p.code}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p)}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="Eliminar"
                        aria-label={`Eliminar ${p.code}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/>
                          <path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No hay proyectos asignados.</td></tr>
              )}
            </Table>
          )}
        </div>
      )}

      {/* Tab: hours */}
      {activeTab === "hours" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Pendientes de revision: {projectEntries.filter((entry) => entry.reviewStatus === "PENDING").length + pendingHourBagEntries.length}
          </div>
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-slate-600">Proyecto</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
              >
                <option value="">Todos los proyectos</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
              </select>
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-slate-600">Tarea</label>
              <input
                type="text"
                value={filterTaskName}
                onChange={(e) => setFilterTaskName(e.target.value)}
                placeholder="Ej: Cálculo uniones atornilladas"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="min-w-0 sm:col-span-2 lg:col-span-1 lg:min-w-[180px]">
              <label className="mb-1 block text-xs font-medium text-slate-600">Mes (opcional)</label>
              <input
                type="month"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table headers={["Fecha", "Trabajador", "Proyecto", "Tarea", "Horas", "Estado", "Descripción", ""]}>
              {projectEntries.map((e) => {
                const proj = projects.find((p) => p.id === e.projectId);
                const worker = departmentUsers.find((u) => u.id === e.userId);
                const isHigh = e.hours > 8;
                return (
                  <tr key={e.id} className={`border-t border-slate-100 ${isHigh ? "bg-amber-50" : "hover:bg-slate-50"}`}>
                    <td className="px-4 py-2 text-sm">{e.date}</td>
                    <td className="px-4 py-2 text-sm">{e.userName ?? worker?.name ?? e.userId}</td>
                    <td className="px-4 py-2 text-sm font-medium">{e.projectName ?? proj?.code ?? e.projectId}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{e.taskName ?? e.taskId}</td>
                    <td className={`px-4 py-2 text-sm font-semibold ${isHigh ? "text-amber-600" : ""}`}>
                      {e.hours}h {isHigh && <span className="text-xs">⚠</span>}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${REVIEW_STATUS_COLORS[e.reviewStatus] ?? REVIEW_STATUS_COLORS.PENDING}`}>
                        {REVIEW_STATUS_LABELS[e.reviewStatus] ?? e.reviewStatus}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-2 text-sm text-slate-600">
                      <span className="block truncate">{e.description}</span>
                      {e.rejectionReason && (
                        <span className="mt-1 block text-xs text-red-600">
                          Motivo: {e.rejectionReason}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {e.reviewStatus === "PENDING" ? (
                        <Button onClick={() => { setTimeEntryReviewTarget(e); setTimeEntryRejectReason(""); }}>
                          Revisar
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">Revisada</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {projectEntries.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Sin imputaciones para los filtros seleccionados.</td></tr>
              )}
            </Table>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h4 className="font-medium">Solicitudes pendientes de bolsa de horas</h4>
            </div>
            <Table headers={["Trabajador", "Proyecto", "Proyecto bolsa", "Tarea", "Horas", "Fecha", ""]}>
              {pendingHourBagEntries.map((entry) => {
                const project = projects.find((item) => item.id === entry.projectId);
                const worker = departmentUsers.find((user) => user.id === entry.assignedUserId);
                return (
                  <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm">{worker?.name ?? entry.assignedUserId ?? "—"}</td>
                    <td className="px-4 py-2 text-sm font-medium">{project?.code ?? entry.projectId}</td>
                    <td className="px-4 py-2 text-sm">{entry.externalProjectName}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{entry.taskName}</td>
                    <td className="px-4 py-2 text-sm font-semibold">{entry.hours ?? 0}h</td>
                    <td className="px-4 py-2 text-sm">{entry.date ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <Button onClick={() => { setHourBagReviewTarget(entry); setHourBagRejectReason(""); }}>
                        Revisar
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {pendingHourBagEntries.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No hay solicitudes pendientes de bolsa de horas.</td></tr>
              )}
            </Table>
          </div>
        </div>
      )}

      {/* Tab: expenses */}
      {activeTab === "expenses" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table headers={["Proyecto", "Trabajador", "Partida", "Importe", "Descripción", "Estado", ""]}>
            {pendingExpenses.map((e) => {
              const proj = projects.find((p) => p.id === e.projectId);
              return (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium">{proj?.code ?? e.projectId}</td>
                  <td className="px-4 py-3 text-sm">{e.userId}</td>
                  <td className="px-4 py-3 text-sm">{e.partitionId}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{e.amount.toFixed(2)} €</td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-600">{e.description}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pendiente</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      onClick={() => { setExpenseTarget(e); setRejectReason(""); setExpenseOpen(true); }}
                    >
                      Revisar
                    </Button>
                  </td>
                </tr>
              );
            })}
            {pendingExpenses.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No hay gastos pendientes de revisión.</td></tr>
            )}
          </Table>
        </div>
      )}

      {/* Create project modal (coordinator) */}
      <Modal open={formOpen} title={editProjectId ? "Editar proyecto" : "Nuevo proyecto"} onClose={() => setFormOpen(false)} panelClassName="max-w-5xl">
        <div className="space-y-3 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Código" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="IDI.250001" />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Cliente</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={form.hasClient}
                  onChange={(e) => setForm((f) => ({ ...f, hasClient: e.target.checked, clientName: e.target.checked ? f.clientName : "" }))}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                <span className="text-sm text-slate-700">Proyecto con cliente externo</span>
              </label>
            </div>
          </div>
          {form.hasClient && (
            <Input
              label="Nombre del cliente"
              value={form.clientName}
              onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
              placeholder="Empresa o entidad cliente"
            />
          )}
          <Input label="Nombre del proyecto" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre completo del proyecto" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha inicio (opcional)" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            <Input label="Fecha fin (opcional)" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Horas presupuestadas (opcional)"
              type="number"
              min="1"
              value={form.totalBudgetHours}
              onChange={(e) => setForm((f) => ({ ...f, totalBudgetHours: e.target.value }))}
              placeholder="Ej: 500"
            />
            <Select
              label="Modo imputación de horas"
              value={form.hourTrackingMode}
              onChange={(e) => setForm((f) => ({ ...f, hourTrackingMode: e.target.value as HourTrackingMode }))}
              disabled={Boolean(editProjectId)}
              options={[
                { label: "General (presupuesto total)", value: "GENERAL" },
                { label: "Especifica (paquetes y tareas)", value: "STRUCTURED" },
                { label: "Building Block (selección de BB)", value: "BUILDING_BLOCK" },
                { label: "Bolsa de horas", value: "BOLSA_HORAS" },
              ]}
            />
          </div>
          {!editProjectId && (form.hourTrackingMode === "STRUCTURED" || form.hourTrackingMode === "BUILDING_BLOCK") && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Paquetes de trabajo y tareas</h4>
                {form.hourTrackingMode === "STRUCTURED" && (
                  <Button variant="secondary" onClick={addWorkPackageDraft}>+ Paquete</Button>
                )}
              </div>
              {form.hourTrackingMode === "BUILDING_BLOCK" && (
                <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Build Blocks del proyecto
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {BUILDING_BLOCK_OPTIONS.map((option) => {
                      const selected = workPackagesDraft.some(
                        (wp) => wp.name.trim().toUpperCase() === option.code,
                      );
                      return (
                        <label key={option.code} className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => toggleBuildingBlockSelection(option.code, e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
                          />
                          <span className="font-medium">{option.code}</span>
                          <span className="text-slate-500">{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {form.hourTrackingMode === "BUILDING_BLOCK" && (
                <div className="flex gap-2">
                  {workPackagesDraft.map((wp) => {
                    const bbName = wp.name.trim().toUpperCase();
                    return (
                    <button
                      key={bbName}
                      type="button"
                      onClick={() => setActiveBuildingBlock(bbName)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        activeBuildingBlock === bbName
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {bbName}
                    </button>
                  )})}
                </div>
              )}
              {(form.hourTrackingMode === "BUILDING_BLOCK"
                ? workPackagesDraft.filter((wp) => wp.name.trim().toUpperCase() === activeBuildingBlock)
                : workPackagesDraft
              ).map((wp, wpIndex) => (
                <div key={wp.tempId} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium">
                      {form.hourTrackingMode === "BUILDING_BLOCK" ? `Building Block ${wp.name}` : `Paquete ${wpIndex + 1}`}
                    </h5>
                    {form.hourTrackingMode === "STRUCTURED" && (
                      <button type="button" className="text-xs font-medium text-red-600 hover:text-red-700" onClick={() => removeWorkPackageDraft(wp.tempId)}>
                        Eliminar paquete
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nombre paquete" value={wp.name} disabled={form.hourTrackingMode === "BUILDING_BLOCK"} onChange={(e) => updateWorkPackageDraft(wp.tempId, "name", e.target.value)} />
                    <Input label="Duración estimada (horas, opcional)" type="number" min="0" value={wp.budgetHours} onChange={(e) => updateWorkPackageDraft(wp.tempId, "budgetHours", e.target.value)} />
                    <Input label="Inicio (opcional)" type="date" value={wp.startDate} onChange={(e) => updateWorkPackageDraft(wp.tempId, "startDate", e.target.value)} />
                    <Input label="Fin (opcional)" type="date" value={wp.endDate} onChange={(e) => updateWorkPackageDraft(wp.tempId, "endDate", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tareas del paquete</h6>
                      {form.hourTrackingMode === "STRUCTURED" && (
                        <button type="button" className="text-xs font-medium text-slate-700 hover:text-slate-900" onClick={() => addTaskDraft(wp.tempId)}>
                          + Tarea
                        </button>
                      )}
                    </div>
                    {form.hourTrackingMode === "BUILDING_BLOCK" && (
                      <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                        {BUILDING_BLOCK_TASK_OPTIONS.map((taskName) => {
                          const selected = wp.tasks.some((task) => normalizeTaskName(task.name) === normalizeTaskName(taskName));
                          return (
                            <label key={`${wp.tempId}-${taskName}`} className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => toggleBuildingBlockTask(wp.tempId, taskName, e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
                              />
                              <span>{taskName}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {wp.tasks.map((task, taskIndex) => (
                      <div key={task.tempId} className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">
                            {form.hourTrackingMode === "BUILDING_BLOCK" ? task.name : `Tarea ${taskIndex + 1}`}
                          </span>
                          {form.hourTrackingMode === "STRUCTURED" && (
                            <button type="button" className="text-xs font-medium text-red-600 hover:text-red-700" onClick={() => removeTaskDraft(wp.tempId, task.tempId)}>
                              Eliminar
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {form.hourTrackingMode === "STRUCTURED" && (
                            <Input label="Nombre tarea" value={task.name} onChange={(e) => updateTaskDraft(wp.tempId, task.tempId, "name", e.target.value)} />
                          )}
                          <Input label="Duración estimada (horas, opcional)" type="number" min="0" value={task.budgetHours} onChange={(e) => updateTaskDraft(wp.tempId, task.tempId, "budgetHours", e.target.value)} />
                          <Input label="Inicio (opcional)" type="date" value={task.startDate} onChange={(e) => updateTaskDraft(wp.tempId, task.tempId, "startDate", e.target.value)} />
                          <Input label="Fin (opcional)" type="date" value={task.endDate} onChange={(e) => updateTaskDraft(wp.tempId, task.tempId, "endDate", e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {workPackagesDraft.length === 0 && (
                <p className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">No hay paquetes añadidos.</p>
              )}
            </div>
          )}
          {!editProjectId && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
            <h4 className="text-sm font-semibold">Asignación de trabajadores del departamento</h4>
            {workerCandidates.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {workerCandidates.map((worker) => (
                  <label key={worker.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={assignedUserIdsDraft.includes(worker.id)}
                      onChange={() => toggleAssignedUser(worker.id)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    <span>{worker.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No hay trabajadores disponibles en tu departamento.</p>
            )}
            </div>
          )}
          {!editProjectId && (form.hourTrackingMode === "STRUCTURED" || form.hourTrackingMode === "BUILDING_BLOCK") && assignedUserIdsDraft.length > 0 && workPackagesDraft.length > 0 && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <h4 className="text-sm font-semibold">Asignación por tareas</h4>
              {workPackagesDraft.map((wp) => (
                <div key={wp.tempId} className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-medium">{wp.name || "Paquete sin nombre"}</p>
                  {wp.tasks.length === 0 && (
                    <p className="text-xs text-slate-400">Sin tareas seleccionadas.</p>
                  )}
                  {wp.tasks.map((task) => (
                    <div key={task.tempId} className="rounded border border-slate-200 bg-white p-3">
                      <p className="mb-2 text-sm font-medium">{task.name || "Tarea sin nombre"}</p>
                      <div className="flex flex-wrap gap-2">
                        {assignedUserIdsDraft.map((userId) => {
                          const worker = workerCandidates.find((u) => u.id === userId);
                          if (!worker) return null;
                          const isAssigned = task.assignedUserIds.includes(userId);
                          return (
                            <label key={`${task.tempId}-${userId}`} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1 text-xs">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => toggleTaskAssignment(wp.tempId, task.tempId, userId)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
                              />
                              <span>{worker.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveProject}>{editProjectId ? "Guardar cambios" : "Crear proyecto"}</Button>
          </div>
        </div>
      </Modal>

      {/* Project detail modal */}
      <Modal open={detailOpen} title={selectedProject?.name ?? "Proyecto"} onClose={() => setDetailOpen(false)} panelClassName="max-w-3xl">
        {selectedProject && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3">
              <div><span className="text-slate-500">Código</span><p className="font-mono font-semibold">{selectedProject.code}</p></div>
              <div><span className="text-slate-500">Cliente</span><p>{selectedProject.clientName ?? "—"}</p></div>
              <div><span className="text-slate-500">Estado</span><p>{STATUS_LABELS[selectedProject.status]}</p></div>
              <div><span className="text-slate-500">Inicio</span><p>{formatDate(selectedProject.startDate)}</p></div>
              <div><span className="text-slate-500">Fin</span><p>{formatDate(selectedProject.endDate)}</p></div>
              <div><span className="text-slate-500">Presupuesto</span><p>{selectedProject.totalBudgetHours != null ? `${selectedProject.totalBudgetHours}h` : "Sin límite"}</p></div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Trabajadores asignados</h4>
              {selectedProject.assignedUserIds.length === 0 ? (
                <p className="text-slate-400">Sin trabajadores asignados.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedProject.assignedUserIds.map((uid) => (
                    <Badge key={uid}>{departmentUsers.find((u) => u.id === uid)?.name ?? uid}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Estructura / Paquetes de trabajo</h4>
              {selectedProject.workPackages.map((wp) => (
                <div key={wp.id} className="mb-3 rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{wp.name}</p>
                    {wp.budgetHours != null && <Badge>{wp.budgetHours}h</Badge>}
                  </div>
                  {(wp.startDate || wp.endDate) && (
                    <p className="text-xs text-slate-400">{wp.startDate} → {wp.endDate}</p>
                  )}
                  <div className="mt-2 space-y-1">
                    {wp.tasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded bg-slate-50 px-3 py-1">
                        <span>{t.isDefault ? "General" : t.name}</span>
                        {t.budgetHours != null && <span className="text-xs text-slate-400">{t.budgetHours}h</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedProject.budgetPartitions.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">Partidas presupuestarias</h4>
                <Table headers={["Partida", "Presupuesto"]}>
                  {selectedProject.budgetPartitions.map((bp) => (
                    <tr key={bp.id} className="border-t border-slate-100">
                      <td className="px-4 py-2">{bp.name}</td>
                      <td className="px-4 py-2 font-semibold">{bp.budgetAmount.toFixed(2)} €</td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
            {selectedProject.hourTrackingMode === "BOLSA_HORAS" && (
              <HourBagEntriesPanel
                project={selectedProject}
                workerOptions={selectedProjectHourBagWorkerOptions}
                onProjectUpdated={setSelectedProject}
                onToast={setToast}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Expense review modal */}
      <Modal open={expenseOpen} title="Revisar gasto" onClose={() => setExpenseOpen(false)}>
        {expenseTarget && (
          <div className="space-y-4 pb-2 text-sm">
            <div className="rounded-lg bg-slate-50 p-3 space-y-1">
              <p><span className="text-slate-500">Trabajador:</span> {expenseTarget.userId}</p>
              <p><span className="text-slate-500">Importe:</span> <strong>{expenseTarget.amount.toFixed(2)} €</strong></p>
              <p><span className="text-slate-500">Partida:</span> {expenseTarget.partitionId}</p>
              <p><span className="text-slate-500">Descripción:</span> {expenseTarget.description}</p>
              {expenseTarget.receiptUrl && (
                <p><a href={expenseTarget.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver ticket adjunto</a></p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-slate-700">Motivo de rechazo <span className="text-slate-400">(solo si rechazas)</span></label>
              <textarea
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Indica el motivo…"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleRejectExpense(expenseTarget.id)}>Rechazar</Button>
              <Button onClick={() => handleApproveExpense(expenseTarget.id)}>Aprobar</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(timeEntryReviewTarget)} title="Revisar horas" onClose={() => setTimeEntryReviewTarget(null)}>
        {timeEntryReviewTarget && (
          <div className="space-y-4 pb-2 text-sm">
            <div className="rounded-lg bg-slate-50 p-3 space-y-1">
              <p><span className="text-slate-500">Trabajador:</span> {timeEntryReviewTarget.userName ?? departmentUsers.find((user) => user.id === timeEntryReviewTarget.userId)?.name ?? timeEntryReviewTarget.userId}</p>
              <p><span className="text-slate-500">Proyecto:</span> {timeEntryReviewTarget.projectName ?? projects.find((project) => project.id === timeEntryReviewTarget.projectId)?.name ?? timeEntryReviewTarget.projectId}</p>
              <p><span className="text-slate-500">Tarea:</span> {timeEntryReviewTarget.taskName ?? timeEntryReviewTarget.taskId}</p>
              <p><span className="text-slate-500">Fecha:</span> {timeEntryReviewTarget.date}</p>
              <p><span className="text-slate-500">Horas:</span> <strong>{timeEntryReviewTarget.hours}h</strong></p>
              <p><span className="text-slate-500">Descripcion:</span> {timeEntryReviewTarget.description}</p>
            </div>
            <div>
              <label className="mb-1 block text-slate-700">Motivo de rechazo <span className="text-slate-400">(solo si rechazas)</span></label>
              <textarea
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                value={timeEntryRejectReason}
                onChange={(e) => setTimeEntryRejectReason(e.target.value)}
                placeholder="Indica el motivo..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleRejectProjectTimeEntry(timeEntryReviewTarget.id)}>Rechazar</Button>
              <Button onClick={() => handleApproveProjectTimeEntry(timeEntryReviewTarget.id)}>Aprobar</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(hourBagReviewTarget)} title="Revisar bolsa de horas" onClose={() => setHourBagReviewTarget(null)}>
        {hourBagReviewTarget && (
          <div className="space-y-4 pb-2 text-sm">
            <div className="rounded-lg bg-slate-50 p-3 space-y-1">
              <p><span className="text-slate-500">Trabajador:</span> {departmentUsers.find((user) => user.id === hourBagReviewTarget.assignedUserId)?.name ?? hourBagReviewTarget.assignedUserId ?? "—"}</p>
              <p><span className="text-slate-500">Proyecto:</span> {projects.find((project) => project.id === hourBagReviewTarget.projectId)?.name ?? hourBagReviewTarget.projectId}</p>
              <p><span className="text-slate-500">Proyecto bolsa:</span> {hourBagReviewTarget.externalProjectName}</p>
              <p><span className="text-slate-500">Tarea:</span> {hourBagReviewTarget.taskName}</p>
              <p><span className="text-slate-500">Fecha:</span> {hourBagReviewTarget.date ?? "—"}</p>
              <p><span className="text-slate-500">Horas:</span> <strong>{hourBagReviewTarget.hours ?? 0}h</strong></p>
            </div>
            <div>
              <label className="mb-1 block text-slate-700">Motivo de rechazo <span className="text-slate-400">(solo si rechazas)</span></label>
              <textarea
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                value={hourBagRejectReason}
                onChange={(e) => setHourBagRejectReason(e.target.value)}
                placeholder="Indica el motivo..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleRejectHourBagEntry(hourBagReviewTarget.projectId, hourBagReviewTarget.id)}>Rechazar</Button>
              <Button onClick={() => handleApproveHourBagEntry(hourBagReviewTarget.projectId, hourBagReviewTarget.id)}>Aprobar</Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}

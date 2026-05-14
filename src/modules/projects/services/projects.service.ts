import { createProjectsRepository } from "../repositories/projects.repository";
import { createNotificationsRepository } from "../../notifications/repositories/notifications.repository";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type {
  AuthenticatedApiUser,
  CreateProjectHourBagEntryInput,
  CreateProjectInput,
  ProjectHourBagEntryRecord,
  ProjectWithDetails,
  ProjectWorkerView,
  UpdateProjectHourBagEntryInput,
  UpdateProjectInput,
  CreateWorkPackageInput,
  CreateTaskInput,
  CreateBudgetPartitionInput,
} from "../domain/types";

const projectsRepo = createProjectsRepository();
const notificationsRepo = createNotificationsRepository();
const directoryRepo = createDirectoryRepository();
const BUILDING_BLOCK_CODES = [
  "BB_A",
  "BB_ALL",
  "BB_B",
  "BB_C",
  "BB_D",
  "BB_E",
  "BB_F",
  "BB_G",
  "BB_H",
  "BB_J",
  "BB_K",
  "BB_L",
  "BB_T",
  "DM_MAQUETAS",
  "REHABILITACIONES",
  "VARIOS CALIDAD HOM. SOP. INGENIERIA",
  "VARIOS GESTIÓN CONFIGURACIÓN",
] as const;
const BUILDING_BLOCK_TASKS = [
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
const BUILDING_BLOCK_TASK_SET = new Set(BUILDING_BLOCK_TASKS.map(normalizeTaskName));

// ── Helpers ───────────────────────────────────────────────────────────────────

const assertManagerAccess = (user: AuthenticatedApiUser, managerId: string): void => {
  if (user.role === "admin" || user.canManageProjects) return;
  if (user.role === "coordinator" && user.userId === managerId) return;
  throw new Error("FORBIDDEN");
};

const assertCanManageProject = async (
  user: AuthenticatedApiUser,
  projectId: string,
): Promise<void> => {
  if (user.role === "admin" || user.canManageProjects) return;
  const project = await projectsRepo.getById(projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  if (project.managerId !== user.userId) throw new Error("FORBIDDEN");
};

const assertHourBagProject = async (
  projectId: string,
): Promise<void> => {
  const project = await projectsRepo.getById(projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  if (project.hourTrackingMode !== "BOLSA_HORAS") {
    throw new Error("Este proyecto no usa modo Bolsa de horas.");
  }
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const listProjects = async (user: AuthenticatedApiUser) => {
  if (user.role === "admin" || user.canManageProjects) return projectsRepo.listAll();
  if (user.role === "coordinator") return projectsRepo.listByManager(user.userId);
  return projectsRepo.listByUser(user.userId);
};

export const getProjectDetail = async (
  user: AuthenticatedApiUser,
  projectId: string,
): Promise<ProjectWithDetails> => {
  const project = await projectsRepo.getById(projectId);
  if (!project) throw new Error("Proyecto no encontrado.");

  // Workers solo ven proyectos en los que están asignados
  if (user.role === "worker") {
    const assignments = await projectsRepo.listAssignmentsByProject(projectId);
    if (!assignments.some((a) => a.userId === user.userId)) {
      throw new Error("FORBIDDEN");
    }
  }

  const manager = await directoryRepo.findUserById(project.managerId);
  const details = await projectsRepo.getProjectWithDetails(projectId, manager?.name ?? "—");
  if (!details) throw new Error("Proyecto no encontrado.");
  return details;
};

export const getProjectWorkerView = async (
  user: AuthenticatedApiUser,
  projectId: string,
): Promise<ProjectWorkerView> => {
  const assignments = await projectsRepo.listAssignmentsByProject(projectId);
  if (!assignments.some((a) => a.userId === user.userId)) {
    throw new Error("FORBIDDEN");
  }
  const project = await projectsRepo.getById(projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  const manager = await directoryRepo.findUserById(project.managerId);
  const view = await projectsRepo.getProjectWorkerView(projectId, user.userId, manager?.name ?? "—");
  if (!view) throw new Error("Proyecto no encontrado.");
  return view;
};

export const createProject = async (
  user: AuthenticatedApiUser,
  input: CreateProjectInput,
): Promise<ProjectWithDetails> => {
  if (user.role === "worker" && !user.canManageProjects) throw new Error("FORBIDDEN");

  // Si lo crea un coordinador (y no es gestor transversal), él es siempre el manager.
  // Si es admin o gestor transversal, puede elegir el manager.
  const managerId = (user.role === "coordinator" && !user.canManageProjects) ? user.userId : input.managerId;

  // Validaciones básicas
  if (!input.code?.trim()) throw new Error("El código del proyecto es obligatorio.");
  if (!input.name?.trim()) throw new Error("El nombre del proyecto es obligatorio.");
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha fin.");
  }
  if (input.totalBudgetHours != null && input.totalBudgetHours <= 0) {
    throw new Error("Las horas presupuestadas deben ser mayor que cero.");
  }

  const project = await projectsRepo.create({ ...input, managerId }, user.userId);

  if (input.hourTrackingMode === "GENERAL" || input.hourTrackingMode === "BOLSA_HORAS") {
    // Tarea única por defecto para proyectos generales.
    await projectsRepo.createTask(project.id, null, "General", null, null, null, true, 0);
  } else if (input.hourTrackingMode === "STRUCTURED") {
    if (input.workPackages?.length) {
      for (let i = 0; i < input.workPackages.length; i++) {
        const wpInput = input.workPackages[i];
        const wp = await projectsRepo.createWorkPackage(project.id, wpInput, i + 1);
        if (wpInput.tasks?.length) {
          for (let j = 0; j < wpInput.tasks.length; j++) {
            const t = wpInput.tasks[j];
            await projectsRepo.createTask(
              project.id, wp.id, t.name, t.budgetHours ?? null,
              t.startDate ?? null, t.endDate ?? null, false, j + 1,
            );
          }
        }
      }
    }
  } else {
    if (!input.workPackages?.length) {
      throw new Error("En modo BUILDING_BLOCK debes seleccionar al menos un Building Block.");
    }
    const byName = new Map(
      (input.workPackages ?? []).map((wp) => [wp.name.trim().toUpperCase(), wp] as const),
    );
    for (const existingName of byName.keys()) {
      if (!BUILDING_BLOCK_CODES.includes(existingName as (typeof BUILDING_BLOCK_CODES)[number])) {
        throw new Error(`Building Block no válido: ${existingName}.`);
      }
    }
    const selectedCodes = BUILDING_BLOCK_CODES.filter((code) => byName.has(code));
    for (let i = 0; i < selectedCodes.length; i++) {
      const bbName = selectedCodes[i];
      const wpInput = byName.get(bbName)!;
      const wp = await projectsRepo.createWorkPackage(
        project.id,
        {
          name: bbName,
          budgetHours: wpInput.budgetHours ?? null,
          startDate: wpInput.startDate ?? null,
          endDate: wpInput.endDate ?? null,
          tasks: wpInput.tasks ?? [],
        },
        i + 1,
      );
      const tasks = wpInput.tasks ?? [];
      if (tasks.length === 0) {
        throw new Error(`El Building Block ${bbName} debe tener al menos una tarea.`);
      }
      for (let j = 0; j < tasks.length; j++) {
        const t = tasks[j];
        if (!BUILDING_BLOCK_TASK_SET.has(normalizeTaskName(t.name))) {
          throw new Error(`La tarea "${t.name}" no está permitida en Building Block.`);
        }
        await projectsRepo.createTask(
          project.id, wp.id, t.name, t.budgetHours ?? null,
          t.startDate ?? null, t.endDate ?? null, false, j + 1,
        );
      }
    }
  }

  // Asignar trabajadores al proyecto
  if (input.assignedUserIds?.length) {
    for (const userId of input.assignedUserIds) {
      await projectsRepo.addProjectAssignment(project.id, userId, user.userId);
    }
  }

  // Crear partidas presupuestarias
  if (input.budgetPartitions?.length) {
    for (const partition of input.budgetPartitions) {
      await projectsRepo.createPartition(project.id, partition.name, partition.budgetAmount);
    }
  }

  const manager = await directoryRepo.findUserById(managerId);
  return (await projectsRepo.getProjectWithDetails(project.id, manager?.name ?? "—"))!;
};

export const updateProject = async (
  user: AuthenticatedApiUser,
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectWithDetails> => {
  await assertCanManageProject(user, projectId);

  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha fin.");
  }

  const updated = await projectsRepo.update(projectId, input);
  const manager = await directoryRepo.findUserById(updated.managerId);
  return (await projectsRepo.getProjectWithDetails(projectId, manager?.name ?? "—"))!;
};

export const deleteProject = async (
  user: AuthenticatedApiUser,
  projectId: string,
): Promise<void> => {
  await assertCanManageProject(user, projectId);
  const existing = await projectsRepo.getById(projectId);
  if (!existing) throw new Error("Proyecto no encontrado.");
  await projectsRepo.deleteById(projectId);
};

// ── Work packages & tasks ─────────────────────────────────────────────────────

export const addWorkPackage = async (
  user: AuthenticatedApiUser,
  projectId: string,
  input: CreateWorkPackageInput,
): Promise<void> => {
  await assertCanManageProject(user, projectId);
  const existing = await projectsRepo.listWorkPackagesByProject(projectId);
  const wp = await projectsRepo.createWorkPackage(projectId, input, existing.length + 1);
  if (input.tasks?.length) {
    for (let i = 0; i < input.tasks.length; i++) {
      const t = input.tasks[i];
      await projectsRepo.createTask(
        projectId, wp.id, t.name, t.budgetHours ?? null,
        t.startDate ?? null, t.endDate ?? null, false, i + 1,
      );
    }
  }
};

export const addTask = async (
  user: AuthenticatedApiUser,
  projectId: string,
  workPackageId: string | null,
  input: CreateTaskInput,
): Promise<void> => {
  await assertCanManageProject(user, projectId);
  const existing = await projectsRepo.listTasksByProject(projectId);
  const position = existing.filter((t) => t.workPackageId === workPackageId).length + 1;
  await projectsRepo.createTask(
    projectId, workPackageId, input.name, input.budgetHours ?? null,
    input.startDate ?? null, input.endDate ?? null, false, position,
  );
};

// ── Assignments ───────────────────────────────────────────────────────────────

export const assignUsersToProject = async (
  user: AuthenticatedApiUser,
  projectId: string,
  userIds: string[],
): Promise<void> => {
  await assertCanManageProject(user, projectId);
  for (const userId of userIds) {
    await projectsRepo.addProjectAssignment(projectId, userId, user.userId);
  }
};

export const removeUserFromProject = async (
  user: AuthenticatedApiUser,
  projectId: string,
  userId: string,
): Promise<void> => {
  await assertCanManageProject(user, projectId);
  await projectsRepo.removeProjectAssignment(projectId, userId);
};

export const assignUserToTask = async (
  user: AuthenticatedApiUser,
  projectId: string,
  taskId: string,
  userId: string,
): Promise<void> => {
  await assertCanManageProject(user, projectId);
  const project = await projectsRepo.getById(projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  // Verificar que el usuario está asignado al proyecto
  const projectAssignments = await projectsRepo.listAssignmentsByProject(projectId);
  if (!projectAssignments.some((a) => a.userId === userId)) {
    throw new Error("El usuario no está asignado al proyecto.");
  }
  const targetTask = await projectsRepo.getTaskById(taskId);
  if (!targetTask || targetTask.projectId !== projectId) {
    throw new Error("Tarea no válida para este proyecto.");
  }
  if (project.hourTrackingMode === "BUILDING_BLOCK") {
    if (!targetTask.workPackageId) {
      throw new Error("En modo BUILDING_BLOCK la tarea debe pertenecer a un BB.");
    }
  }
  await projectsRepo.addTaskAssignment(projectId, taskId, userId, user.userId);
};

export const removeUserFromTask = async (
  user: AuthenticatedApiUser,
  projectId: string,
  taskId: string,
  userId: string,
): Promise<void> => {
  await assertCanManageProject(user, projectId);
  await projectsRepo.removeTaskAssignment(taskId, userId);
};

// ── Budget partitions ─────────────────────────────────────────────────────────

export const addBudgetPartition = async (
  user: AuthenticatedApiUser,
  projectId: string,
  input: CreateBudgetPartitionInput,
): Promise<void> => {
  await assertCanManageProject(user, projectId);
  if (!input.name?.trim()) throw new Error("El nombre de la partida es obligatorio.");
  if (input.budgetAmount <= 0) throw new Error("El importe debe ser mayor que cero.");
  await projectsRepo.createPartition(projectId, input.name, input.budgetAmount);
};

// ── Hour bag entries ──────────────────────────────────────────────────────────

const validateHourBagInput = (
  input: Partial<CreateProjectHourBagEntryInput>,
  options: { partial: boolean },
): void => {
  const requiredString = (value: string | undefined, label: string): void => {
    if (options.partial && value === undefined) return;
    if (!value?.trim()) throw new Error(`${label} es obligatorio.`);
  };

  // En Bolsa de Horas solo son imprescindibles Proyecto + Tarea.
  // El recurso (trabajador) se valida en addHourBagEntry mediante assignedUserIds.
  requiredString(input.externalProjectName, "Proyecto");
  requiredString(input.taskName, "Tarea");
  if (input.hours !== undefined && input.hours !== null) {
    if (Number.isNaN(input.hours) || input.hours <= 0) {
      throw new Error("Horas debe ser mayor que cero.");
    }
  }
  if (input.date !== undefined && input.date !== null) {
    if (!input.date.trim()) throw new Error("Fecha es obligatoria.");
  }
};

export const addHourBagEntry = async (
  user: AuthenticatedApiUser,
  projectId: string,
  input: CreateProjectHourBagEntryInput,
  assignedUserIds: string[],
): Promise<ProjectHourBagEntryRecord> => {
  await assertCanManageProject(user, projectId);
  await assertHourBagProject(projectId);
  validateHourBagInput(input, { partial: false });
  if (!assignedUserIds.length) {
    throw new Error("Debes asignar al menos un trabajador.");
  }

  const assignments = await projectsRepo.listAssignmentsByProject(projectId);
  const assignedProjectUserIds = new Set(assignments.map((assignment) => assignment.userId));
  const validUserIds: string[] = [];
  for (const userId of assignedUserIds) {
    if (!assignedProjectUserIds.has(userId)) {
      throw new Error("Todos los recursos deben estar asignados al proyecto.");
    }
    const resource = await directoryRepo.findUserById(userId);
    if (!resource || resource.role !== "worker") {
      throw new Error("Solo se pueden asignar trabajadores.");
    }
    validUserIds.push(userId);
  }

  let first: ProjectHourBagEntryRecord | null = null;
  for (const userId of validUserIds) {
    const resource = await directoryRepo.findUserById(userId);
    const created = await projectsRepo.createHourBagEntry(
      projectId,
      userId,
      {
        ...input,
        resourceName: resource?.name ?? input.resourceName ?? "",
      },
      user.userId,
    );
    if (!first) first = created;
  }

  return first!;
};

export const updateHourBagEntry = async (
  user: AuthenticatedApiUser,
  projectId: string,
  entryId: string,
  input: UpdateProjectHourBagEntryInput,
): Promise<ProjectHourBagEntryRecord> => {
  await assertCanManageProject(user, projectId);
  await assertHourBagProject(projectId);
  const existing = await projectsRepo.getHourBagEntryById(entryId);
  if (!existing || existing.projectId !== projectId) {
    throw new Error("Registro de bolsa no encontrado.");
  }
  validateHourBagInput(input as Partial<CreateProjectHourBagEntryInput>, { partial: true });
  return projectsRepo.updateHourBagEntry(entryId, input, user.userId);
};

export const deleteHourBagEntry = async (
  user: AuthenticatedApiUser,
  projectId: string,
  entryId: string,
): Promise<void> => {
  await assertCanManageProject(user, projectId);
  await assertHourBagProject(projectId);
  const existing = await projectsRepo.getHourBagEntryById(entryId);
  if (!existing || existing.projectId !== projectId) {
    throw new Error("Registro de bolsa no encontrado.");
  }
  await projectsRepo.deleteHourBagEntry(entryId);
};

export const listPendingHourBagEntriesForManager = async (
  user: AuthenticatedApiUser,
): Promise<ProjectHourBagEntryRecord[]> => {
  if (user.role === "worker" && !user.canManageProjects) throw new Error("FORBIDDEN");

  const projects =
    (user.role === "admin" || user.canManageProjects)
      ? await projectsRepo.listAll()
      : await projectsRepo.listByManager(user.userId);

  return projectsRepo.listPendingHourBagEntriesByManagedProjects(projects.map((project) => project.id));
};

export const workerLogHourBagEntry = async (
  user: AuthenticatedApiUser,
  projectId: string,
  entryId: string,
  input: Pick<UpdateProjectHourBagEntryInput, "hours" | "date">,
): Promise<ProjectHourBagEntryRecord> => {
  if (user.role !== "worker") throw new Error("FORBIDDEN");
  const existing = await projectsRepo.getHourBagEntryById(entryId);
  if (!existing || existing.projectId !== projectId) {
    throw new Error("Registro de bolsa no encontrado.");
  }
  if (existing.assignedUserId !== user.userId) {
    throw new Error("FORBIDDEN");
  }
  if (input.hours == null || Number.isNaN(input.hours) || input.hours <= 0) {
    throw new Error("Horas debe ser mayor que cero.");
  }
  const updated = await projectsRepo.updateHourBagEntry(
    entryId,
    {
      hours: input.hours,
      ...(input.date !== undefined ? { date: input.date } : {}),
    },
    user.userId,
    {
      reviewStatus: "PENDING",
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
    },
  );
  const project = await projectsRepo.getById(projectId);
  const worker = await directoryRepo.findUserById(user.userId);
  if (project) {
    await notificationsRepo.create({
      toUserId: project.managerId,
      type: "PROJECT_HOUR_BAG_PENDING",
      payload: {
        entryId,
        projectId,
        projectName: project.name,
        userId: user.userId,
        workerName: worker?.name ?? "—",
        externalProjectName: updated.externalProjectName,
        taskName: updated.taskName,
        date: updated.date,
        hours: updated.hours,
      },
    });
  }
  return updated;
};

export const approveHourBagEntry = async (
  user: AuthenticatedApiUser,
  projectId: string,
  entryId: string,
): Promise<ProjectHourBagEntryRecord> => {
  if (user.role === "worker" && !user.canManageProjects) throw new Error("FORBIDDEN");

  const entry = await projectsRepo.getHourBagEntryById(entryId);
  if (!entry || entry.projectId !== projectId) {
    throw new Error("Registro de bolsa no encontrado.");
  }
  if (entry.reviewStatus !== "PENDING") {
    throw new Error("Solo se pueden aprobar solicitudes pendientes.");
  }

  await assertCanManageProject(user, projectId);
  const reviewedAt = new Date().toISOString().replace("T", " ").replace("Z", "");
  const approved = await projectsRepo.updateHourBagEntry(entryId, {}, user.userId, {
    reviewStatus: "APPROVED",
    reviewedBy: user.userId,
    reviewedAt,
    rejectionReason: null,
  });

  if (entry.assignedUserId) {
    const project = await projectsRepo.getById(projectId);
    await notificationsRepo.create({
      toUserId: entry.assignedUserId,
      type: "PROJECT_HOUR_BAG_APPROVED",
      payload: {
        entryId,
        projectId,
        projectName: project?.name ?? "—",
        externalProjectName: entry.externalProjectName,
        taskName: entry.taskName,
        date: approved.date,
        hours: approved.hours,
      },
    });
  }
  return approved;
};

export const rejectHourBagEntry = async (
  user: AuthenticatedApiUser,
  projectId: string,
  entryId: string,
  reason: string,
): Promise<ProjectHourBagEntryRecord> => {
  if (user.role === "worker" && !user.canManageProjects) throw new Error("FORBIDDEN");
  if (!reason?.trim()) throw new Error("El motivo de rechazo es obligatorio.");

  const entry = await projectsRepo.getHourBagEntryById(entryId);
  if (!entry || entry.projectId !== projectId) {
    throw new Error("Registro de bolsa no encontrado.");
  }
  if (entry.reviewStatus !== "PENDING") {
    throw new Error("Solo se pueden rechazar solicitudes pendientes.");
  }

  await assertCanManageProject(user, projectId);
  const reviewedAt = new Date().toISOString().replace("T", " ").replace("Z", "");
  const rejected = await projectsRepo.updateHourBagEntry(entryId, {}, user.userId, {
    reviewStatus: "REJECTED",
    reviewedBy: user.userId,
    reviewedAt,
    rejectionReason: reason.trim(),
  });

  if (entry.assignedUserId) {
    const project = await projectsRepo.getById(projectId);
    await notificationsRepo.create({
      toUserId: entry.assignedUserId,
      type: "PROJECT_HOUR_BAG_REJECTED",
      payload: {
        entryId,
        projectId,
        projectName: project?.name ?? "—",
        externalProjectName: entry.externalProjectName,
        taskName: entry.taskName,
        date: rejected.date,
        hours: rejected.hours,
        reason: reason.trim(),
      },
    });
  }
  return rejected;
};

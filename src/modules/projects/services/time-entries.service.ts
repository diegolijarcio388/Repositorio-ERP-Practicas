import { createTimeEntriesRepository } from "../repositories/time-entries.repository";
import { createProjectsRepository } from "../repositories/projects.repository";
import { createNotificationsRepository } from "../../notifications/repositories/notifications.repository";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type {
  AuthenticatedApiUser,
  CreateInternalTimeEntryInput,
  CreateProjectTimeEntryInput,
  InternalTimeEntryFilters,
  InternalTimeEntryRecord,
  ProjectTimeEntryFilters,
  ProjectTimeEntryRecord,
  UpdateInternalTimeEntryInput,
  UpdateProjectTimeEntryInput,
} from "../domain/types";
import { ANOMALY_HOURS_THRESHOLD } from "../domain/types";

const timeEntriesRepo = createTimeEntriesRepository();
const projectsRepo = createProjectsRepository();
const notificationsRepo = createNotificationsRepository();
const directoryRepo = createDirectoryRepository();

const MAX_DAILY_HOURS = 24;
const MIN_ENTRY_HOURS = 0.25;
const MAX_ENTRY_HOURS = 16;

// ── Helpers ───────────────────────────────────────────────────────────────────

const validateHours = (hours: number): void => {
  if (hours < MIN_ENTRY_HOURS || hours > MAX_ENTRY_HOURS) {
    throw new Error(`Las horas deben estar entre ${MIN_ENTRY_HOURS} y ${MAX_ENTRY_HOURS}.`);
  }
};

const checkDailyLimit = async (userId: string, date: string, additionalHours: number, excludeEntryId?: string): Promise<void> => {
  const projectHours = await timeEntriesRepo.sumProjectHoursForUserOnDate(userId, date);
  const internalHours = await timeEntriesRepo.sumInternalHoursForUserOnDate(userId, date);
  // Si hay una entrada que estamos editando, restarla del total actual
  // (simplificación: se controla desde el front la edición)
  if (projectHours + internalHours + additionalHours > MAX_DAILY_HOURS) {
    throw new Error(`El total de horas del día no puede superar ${MAX_DAILY_HOURS}h.`);
  }
};

const notifyAnomalyIfNeeded = async (
  userId: string,
  projectId: string,
  projectName: string,
  date: string,
  newTotalProjectHours: number,
): Promise<void> => {
  if (newTotalProjectHours <= ANOMALY_HOURS_THRESHOLD) return;

  // Obtener el proyecto para saber quién es el manager
  const project = await projectsRepo.getById(projectId);
  if (!project) return;

  const worker = await directoryRepo.findUserById(userId);

  await notificationsRepo.create({
    toUserId: project.managerId,
    type: "PROJECT_TIME_ANOMALY",
    payload: {
      projectId,
      projectName,
      userId,
      workerName: worker?.name ?? "—",
      date,
      hours: newTotalProjectHours,
      threshold: ANOMALY_HOURS_THRESHOLD,
    },
  });
};

// ── Project time entries ──────────────────────────────────────────────────────

export const listProjectTimeEntries = async (
  user: AuthenticatedApiUser,
  filters: ProjectTimeEntryFilters,
): Promise<ProjectTimeEntryRecord[]> => {
  // Workers solo ven sus propias entradas
  if (user.role === "worker") {
    return timeEntriesRepo.listProjectEntries({ ...filters, userId: user.userId });
  }
  return timeEntriesRepo.listProjectEntries(filters);
};

export const listPendingProjectTimeEntriesForManager = async (
  user: AuthenticatedApiUser,
): Promise<ProjectTimeEntryRecord[]> => {
  if (user.role === "worker") throw new Error("FORBIDDEN");

  const projects =
    user.role === "admin"
      ? await projectsRepo.listAll()
      : await projectsRepo.listByManager(user.userId);

  return timeEntriesRepo.listPendingProjectEntriesByManagedProjects(projects.map((project) => project.id));
};

export const createProjectTimeEntry = async (
  user: AuthenticatedApiUser,
  input: CreateProjectTimeEntryInput,
): Promise<ProjectTimeEntryRecord> => {
  validateHours(input.hours);
  if (!input.description?.trim()) throw new Error("La descripción es obligatoria.");

  // Verificar que el usuario está asignado al proyecto
  const projectAssignments = await projectsRepo.listAssignmentsByProject(input.projectId);
  const isAssignedToProject = user.role !== "worker" || projectAssignments.some((a) => a.userId === user.userId);
  if (!isAssignedToProject) throw new Error("No estás asignado a este proyecto.");

  // Verificar que el usuario está asignado a la tarea (solo workers)
  if (user.role === "worker") {
    const taskAssignments = await projectsRepo.listTaskAssignmentsByUser(input.projectId, user.userId);
    if (!taskAssignments.some((a) => a.taskId === input.taskId)) {
      throw new Error("No estás asignado a esta tarea.");
    }
  }

  // Verificar que la tarea pertenece al proyecto
  const task = await projectsRepo.getTaskById(input.taskId);
  if (!task || task.projectId !== input.projectId) throw new Error("Tarea no válida para este proyecto.");

  // Comprobar límite diario
  await checkDailyLimit(user.userId, input.date, input.hours);

  const entry = await timeEntriesRepo.createProjectEntry(
    input.projectId,
    input.taskId,
    user.userId,
    input.date,
    input.hours,
    input.description,
    user.userId,
  );

  const project = await projectsRepo.getById(input.projectId);
  const worker = await directoryRepo.findUserById(user.userId);
  if (project) {
    await notificationsRepo.create({
      toUserId: project.managerId,
      type: "PROJECT_TIME_ENTRY_PENDING",
      payload: {
        entryId: entry.id,
        projectId: input.projectId,
        projectName: project.name,
        taskId: input.taskId,
        taskName: task?.name ?? "General",
        userId: user.userId,
        workerName: worker?.name ?? "—",
        date: input.date,
        hours: input.hours,
        description: input.description.trim(),
      },
    });
  }

  return entry;
};

export const updateProjectTimeEntry = async (
  user: AuthenticatedApiUser,
  entryId: string,
  input: UpdateProjectTimeEntryInput,
): Promise<ProjectTimeEntryRecord> => {
  const entry = await timeEntriesRepo.getProjectEntryById(entryId);
  if (!entry) throw new Error("Entrada no encontrada.");

  // Solo el propio trabajador, coordinador o admin pueden editar
  if (user.role === "worker" && entry.userId !== user.userId) throw new Error("FORBIDDEN");

  if (input.hours !== undefined) validateHours(input.hours);
  if (user.role === "worker" && entry.reviewStatus === "APPROVED") {
    throw new Error("No puedes editar una imputación ya aprobada.");
  }

  return timeEntriesRepo.updateProjectEntry(entryId, user.userId, {
    ...input,
    resetReview: user.role === "worker",
  });
};

export const deleteProjectTimeEntry = async (
  user: AuthenticatedApiUser,
  entryId: string,
): Promise<void> => {
  const entry = await timeEntriesRepo.getProjectEntryById(entryId);
  if (!entry) throw new Error("Entrada no encontrada.");
  if (user.role === "worker" && entry.userId !== user.userId) throw new Error("FORBIDDEN");
  if (user.role === "worker" && entry.reviewStatus === "APPROVED") {
    throw new Error("No puedes eliminar una imputación ya aprobada.");
  }
  await timeEntriesRepo.deleteProjectEntry(entryId);
};

export const approveProjectTimeEntry = async (
  user: AuthenticatedApiUser,
  entryId: string,
): Promise<ProjectTimeEntryRecord> => {
  if (user.role === "worker") throw new Error("FORBIDDEN");

  const entry = await timeEntriesRepo.getProjectEntryById(entryId);
  if (!entry) throw new Error("Entrada no encontrada.");
  if (entry.reviewStatus !== "PENDING") {
    throw new Error("Solo se pueden aprobar imputaciones pendientes.");
  }

  const project = await projectsRepo.getById(entry.projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  if (user.role === "coordinator" && project.managerId !== user.userId) {
    throw new Error("FORBIDDEN");
  }

  const approved = await timeEntriesRepo.approveProjectEntry(entryId, user.userId);
  await notificationsRepo.create({
    toUserId: entry.userId,
    type: "PROJECT_TIME_ENTRY_APPROVED",
    payload: {
      entryId,
      projectId: entry.projectId,
      projectName: project.name,
      date: entry.date,
      hours: entry.hours,
    },
  });
  return approved;
};

export const rejectProjectTimeEntry = async (
  user: AuthenticatedApiUser,
  entryId: string,
  reason: string,
): Promise<ProjectTimeEntryRecord> => {
  if (user.role === "worker") throw new Error("FORBIDDEN");
  if (!reason?.trim()) throw new Error("El motivo de rechazo es obligatorio.");

  const entry = await timeEntriesRepo.getProjectEntryById(entryId);
  if (!entry) throw new Error("Entrada no encontrada.");
  if (entry.reviewStatus !== "PENDING") {
    throw new Error("Solo se pueden rechazar imputaciones pendientes.");
  }

  const project = await projectsRepo.getById(entry.projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  if (user.role === "coordinator" && project.managerId !== user.userId) {
    throw new Error("FORBIDDEN");
  }

  const rejected = await timeEntriesRepo.rejectProjectEntry(entryId, user.userId, reason);
  await notificationsRepo.create({
    toUserId: entry.userId,
    type: "PROJECT_TIME_ENTRY_REJECTED",
    payload: {
      entryId,
      projectId: entry.projectId,
      projectName: project.name,
      date: entry.date,
      hours: entry.hours,
      reason: reason.trim(),
    },
  });
  return rejected;
};

// ── Internal time entries ─────────────────────────────────────────────────────

export const listInternalTimeEntries = async (
  user: AuthenticatedApiUser,
  filters: InternalTimeEntryFilters,
): Promise<InternalTimeEntryRecord[]> => {
  if (user.role === "worker") {
    return timeEntriesRepo.listInternalEntries({ ...filters, userId: user.userId });
  }
  return timeEntriesRepo.listInternalEntries(filters);
};

export const createInternalTimeEntry = async (
  user: AuthenticatedApiUser,
  input: CreateInternalTimeEntryInput,
): Promise<InternalTimeEntryRecord> => {
  validateHours(input.hours);
  if (!input.description?.trim()) throw new Error("La descripción es obligatoria.");

  await checkDailyLimit(user.userId, input.date, input.hours);

  return timeEntriesRepo.createInternalEntry(
    input.category,
    user.userId,
    input.date,
    input.hours,
    input.description,
    user.userId,
  );
};

export const updateInternalTimeEntry = async (
  user: AuthenticatedApiUser,
  entryId: string,
  input: UpdateInternalTimeEntryInput,
): Promise<InternalTimeEntryRecord> => {
  const entry = await timeEntriesRepo.getInternalEntryById(entryId);
  if (!entry) throw new Error("Entrada no encontrada.");
  if (user.role === "worker" && entry.userId !== user.userId) throw new Error("FORBIDDEN");
  if (input.hours !== undefined) validateHours(input.hours);
  return timeEntriesRepo.updateInternalEntry(entryId, user.userId, input);
};

export const deleteInternalTimeEntry = async (
  user: AuthenticatedApiUser,
  entryId: string,
): Promise<void> => {
  const entry = await timeEntriesRepo.getInternalEntryById(entryId);
  if (!entry) throw new Error("Entrada no encontrada.");
  if (user.role === "worker" && entry.userId !== user.userId) throw new Error("FORBIDDEN");
  await timeEntriesRepo.deleteInternalEntry(entryId);
};

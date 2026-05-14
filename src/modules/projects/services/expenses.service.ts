import { createExpensesRepository } from "../repositories/expenses.repository";
import { createProjectsRepository } from "../repositories/projects.repository";
import { createNotificationsRepository } from "../../notifications/repositories/notifications.repository";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type {
  AuthenticatedApiUser,
  CreateExpenseInput,
  ExpenseRecord,
} from "../domain/types";

const expensesRepo = createExpensesRepository();
const projectsRepo = createProjectsRepository();
const notificationsRepo = createNotificationsRepository();
const directoryRepo = createDirectoryRepository();

// ── List ──────────────────────────────────────────────────────────────────────

export const listExpensesByProject = async (
  user: AuthenticatedApiUser,
  projectId: string,
): Promise<ExpenseRecord[]> => {
  const project = await projectsRepo.getById(projectId);
  if (!project) throw new Error("Proyecto no encontrado.");

  if (user.role === "worker") {
    // Workers solo ven sus propios gastos
    const all = await expensesRepo.listByProject(projectId);
    return all.filter((e) => e.userId === user.userId);
  }
  return expensesRepo.listByProject(projectId);
};

export const listMyExpenses = async (user: AuthenticatedApiUser): Promise<ExpenseRecord[]> => {
  return expensesRepo.listByUser(user.userId);
};

export const listPendingExpensesForManager = async (
  user: AuthenticatedApiUser,
): Promise<ExpenseRecord[]> => {
  if (user.role === "worker") throw new Error("FORBIDDEN");

  let projects;
  if (user.role === "admin") {
    projects = await projectsRepo.listAll();
  } else {
    projects = await projectsRepo.listByManager(user.userId);
  }
  return expensesRepo.listPendingByManagedProjects(projects.map((p) => p.id));
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createExpense = async (
  user: AuthenticatedApiUser,
  input: CreateExpenseInput,
): Promise<ExpenseRecord> => {
  if (input.amount <= 0) throw new Error("El importe debe ser mayor que cero.");
  if (!input.description?.trim()) throw new Error("La descripción es obligatoria.");

  // Verificar que la partición pertenece al proyecto
  const partition = await projectsRepo.getPartitionById(input.partitionId);
  if (!partition || partition.projectId !== input.projectId) {
    throw new Error("Partida presupuestaria no válida.");
  }

  // Verificar que el trabajador está asignado al proyecto
  if (user.role === "worker") {
    const assignments = await projectsRepo.listAssignmentsByProject(input.projectId);
    if (!assignments.some((a) => a.userId === user.userId)) {
      throw new Error("No estás asignado a este proyecto.");
    }
  }

  const expense = await expensesRepo.create(
    input.partitionId,
    input.projectId,
    user.userId,
    input.amount,
    input.description,
    input.receiptUrl ?? null,
  );

  // Notificar al manager del proyecto
  const project = await projectsRepo.getById(input.projectId);
  const worker = await directoryRepo.findUserById(user.userId);

  if (project) {
    await notificationsRepo.create({
      toUserId: project.managerId,
      type: "PROJECT_EXPENSE_PENDING",
      payload: {
        expenseId: expense.id,
        projectId: input.projectId,
        projectName: project.name,
        userId: user.userId,
        workerName: worker?.name ?? "—",
        amount: input.amount,
        partitionName: partition.name,
        description: input.description,
      },
    });
  }

  return expense;
};

// ── Review ────────────────────────────────────────────────────────────────────

export const approveExpense = async (
  user: AuthenticatedApiUser,
  expenseId: string,
): Promise<ExpenseRecord> => {
  if (user.role === "worker") throw new Error("FORBIDDEN");

  const expense = await expensesRepo.getById(expenseId);
  if (!expense) throw new Error("Gasto no encontrado.");
  if (expense.status !== "PENDING") throw new Error("Solo se pueden aprobar gastos pendientes.");

  // Verificar que el usuario puede gestionar este proyecto
  if (user.role === "coordinator") {
    const project = await projectsRepo.getById(expense.projectId);
    if (!project || project.managerId !== user.userId) throw new Error("FORBIDDEN");
  }

  const approved = await expensesRepo.approve(expenseId, user.userId);

  // Notificar al trabajador
  const project = await projectsRepo.getById(expense.projectId);
  await notificationsRepo.create({
    toUserId: expense.userId,
    type: "PROJECT_EXPENSE_APPROVED",
    payload: {
      expenseId,
      projectId: expense.projectId,
      projectName: project?.name ?? "—",
      amount: expense.amount,
    },
  });

  return approved;
};

export const rejectExpense = async (
  user: AuthenticatedApiUser,
  expenseId: string,
  reason: string,
): Promise<ExpenseRecord> => {
  if (user.role === "worker") throw new Error("FORBIDDEN");
  if (!reason?.trim()) throw new Error("El motivo de rechazo es obligatorio.");

  const expense = await expensesRepo.getById(expenseId);
  if (!expense) throw new Error("Gasto no encontrado.");
  if (expense.status !== "PENDING") throw new Error("Solo se pueden rechazar gastos pendientes.");

  if (user.role === "coordinator") {
    const project = await projectsRepo.getById(expense.projectId);
    if (!project || project.managerId !== user.userId) throw new Error("FORBIDDEN");
  }

  const rejected = await expensesRepo.reject(expenseId, user.userId, reason);

  const project = await projectsRepo.getById(expense.projectId);
  await notificationsRepo.create({
    toUserId: expense.userId,
    type: "PROJECT_EXPENSE_REJECTED",
    payload: {
      expenseId,
      projectId: expense.projectId,
      projectName: project?.name ?? "—",
      amount: expense.amount,
      reason,
    },
  });

  return rejected;
};

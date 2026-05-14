import { createCaffHoursRepository } from "../repositories/caff-hours.repository";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type {
  CaffTimeEntryFilters,
  CaffTimeEntryRecord,
  CreateCaffTimeEntryInput,
  UpdateCaffTimeEntryInput,
} from "../domain/types";
import type { AuthenticatedApiUser } from "../../projects/domain/types";

const caffRepo = createCaffHoursRepository();
const directoryRepo = createDirectoryRepository();

const isCaffEngineeringWorker = async (user: AuthenticatedApiUser): Promise<boolean> => {
  if (user.role !== "worker") return false;
  const departments = await directoryRepo.listDepartments();
  const department = departments.find((item) => item.id === user.departmentId);
  return (department?.name ?? "").trim().toLowerCase() === "cetemet engineering";
};

const assertCaffAccess = async (user: AuthenticatedApiUser): Promise<void> => {
  if (!(await isCaffEngineeringWorker(user))) {
    throw new Error("FORBIDDEN");
  }
};

const validateHours = (hours: number): void => {
  if (hours < 0.25 || hours > 16) {
    throw new Error("Las horas deben estar entre 0.25 y 16.");
  }
};

export const listCaffTimeEntries = async (
  user: AuthenticatedApiUser,
  filters: CaffTimeEntryFilters,
): Promise<CaffTimeEntryRecord[]> => {
  await assertCaffAccess(user);
  return caffRepo.list({ ...filters, userId: user.userId });
};

export const createCaffTimeEntry = async (
  user: AuthenticatedApiUser,
  input: CreateCaffTimeEntryInput,
): Promise<CaffTimeEntryRecord> => {
  await assertCaffAccess(user);
  validateHours(input.hours);
  if (!input.date) throw new Error("La fecha es obligatoria.");
  if (!input.description?.trim()) throw new Error("La descripción es obligatoria.");
  return caffRepo.create({
    userId: user.userId,
    section: input.section,
    date: input.date,
    hours: input.hours,
    description: input.description,
    createdBy: user.userId,
  });
};

export const updateCaffTimeEntry = async (
  user: AuthenticatedApiUser,
  entryId: string,
  input: UpdateCaffTimeEntryInput,
): Promise<CaffTimeEntryRecord> => {
  await assertCaffAccess(user);
  const existing = await caffRepo.getById(entryId);
  if (!existing) throw new Error("Entrada no encontrada.");
  if (existing.userId !== user.userId) throw new Error("FORBIDDEN");
  if (input.hours !== undefined) validateHours(input.hours);
  return caffRepo.update(entryId, user.userId, input);
};

export const deleteCaffTimeEntry = async (
  user: AuthenticatedApiUser,
  entryId: string,
): Promise<void> => {
  await assertCaffAccess(user);
  const existing = await caffRepo.getById(entryId);
  if (!existing) throw new Error("Entrada no encontrada.");
  if (existing.userId !== user.userId) throw new Error("FORBIDDEN");
  await caffRepo.delete(entryId);
};

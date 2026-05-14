import { createVacationBlocksRepository } from "../repositories/vacation-blocks.repository";
import { normalizeDays } from "./date-helpers";
import type { AuthenticatedApiUser } from "../domain/types";

const blocksRepository = createVacationBlocksRepository();

export class VacationBlocksService {
  private canManageDepartment(user: AuthenticatedApiUser, departmentId: string): boolean {
    return (
      user.role === "admin" ||
      user.canManageVacations ||
      user.coordinatorDepartmentIds.includes(departmentId) ||
      (user.role === "coordinator" && user.departmentId === departmentId)
    );
  }

  async listForDepartment(departmentId: string) {
    return blocksRepository.listByDepartment(departmentId);
  }

  async create(
    user: AuthenticatedApiUser,
    payload: {
      departmentId?: string;
      days?: string[];
      startDate?: string;
      endDate?: string;
      reason?: string;
    },
  ) {
    const departmentId = payload.departmentId ?? user.coordinatorDepartmentIds[0] ?? user.departmentId;
    if (!departmentId) throw new Error("departmentId requerido.");
    if (!this.canManageDepartment(user, departmentId)) {
      throw new Error("No autorizado para gestionar bloqueos de este departamento.");
    }
    if ((!payload.days || payload.days.length === 0) && !(payload.startDate && payload.endDate)) {
      throw new Error("Debe informar days[] o startDate/endDate.");
    }
    return blocksRepository.create({
      departmentId,
      days: payload.days?.length ? normalizeDays(payload.days) : undefined,
      startDate: payload.startDate,
      endDate: payload.endDate,
      reason: payload.reason,
      createdBy: user.userId,
    });
  }

  async delete(blockId: string): Promise<void> {
    await blocksRepository.deleteById(blockId);
  }
}

export const createVacationBlocksService = () => new VacationBlocksService();

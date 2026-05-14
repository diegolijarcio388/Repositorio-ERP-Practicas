import * as XLSX from "xlsx";
import { createDirectoryRepository } from "../../vacations/repositories/directory.repository";
import type { VacationRequestRecord } from "../../vacations/domain/types";

const directoryRepository = createDirectoryRepository();

export class VacationsExportService {
  async buildDailyRows(requests: VacationRequestRecord[]) {
    const users = await directoryRepository.listAllUsers();
    const departments = await directoryRepository.listDepartments();
    const userById = new Map(users.map((user) => [user.id, user]));
    const departmentById = new Map(
      departments.map((department) => [department.id, department]),
    );

    const rows = requests.flatMap((request) => {
      const user = userById.get(request.userId);
      const department = departmentById.get(request.departmentId);
      return request.days.map((day) => ({
        empleado: user?.name ?? request.userId,
        email: user?.email ?? "",
        departamento: department?.name ?? request.departmentId,
        fecha: day,
        estado: request.status,
        aprobadorId: request.approverId ?? "",
        comentario: request.approverComment ?? "",
        createdAt: request.createdAt,
      }));
    });
    return rows.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  async exportAsXlsxBuffer(requests: VacationRequestRecord[]): Promise<Uint8Array> {
    const rows = await this.buildDailyRows(requests);
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "vacaciones_dia");
    return XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as unknown as Uint8Array;
  }
}

export const createVacationsExportService = () => new VacationsExportService();

import type { APIRoute } from "astro";
import { withApiError } from "../../../../core/server/api-handler";
import { requireApiUser } from "../../../../modules/rbac/services/api-auth";
import { createTimeControlExportService } from "../../../../modules/export/services/time-control-export.service";
import { createTimeControlService } from "../../../../modules/time-control/services/time-control.service";

const timeControlService = createTimeControlService();
const timeControlExportService = createTimeControlExportService();

const getTimeOnlyFromSqlDateTime = (value?: string | null): string | null => {
  if (!value) return null;
  const parts = value.split(" ");
  if (parts.length < 2) return null;
  return parts[1]?.slice(0, 5) ?? null;
};

const filterRecordsByHourRange = (
  records: Awaited<ReturnType<typeof timeControlService.getAdminRecords>>,
  hourFrom?: string,
  hourTo?: string,
) =>
  records.filter((record) => {
    const checkInTime = getTimeOnlyFromSqlDateTime(record.checkInAt);
    const checkOutTime = getTimeOnlyFromSqlDateTime(record.checkOutAt);

    if (hourFrom || hourTo) {
      if (!checkInTime) {
        return false;
      }

      const recordStartTime = checkInTime;
      const recordEndTime = checkOutTime ?? checkInTime;

      if (hourFrom && recordEndTime < hourFrom) {
        return false;
      }

      if (hourTo && recordStartTime > hourTo) {
        return false;
      }
    }

    return true;
  });

const sanitizeFileName = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const userId = context.url.searchParams.get("userId") ?? undefined;
  const dateFrom = context.url.searchParams.get("dateFrom") ?? undefined;
  const dateTo = context.url.searchParams.get("dateTo") ?? undefined;
  const hourFrom = context.url.searchParams.get("hourFrom") ?? undefined;
  const hourTo = context.url.searchParams.get("hourTo") ?? undefined;

  if (!userId) {
    throw new Error("Debes seleccionar un trabajador para exportar el informe.");
  }

  if (!dateFrom || !dateTo) {
    throw new Error("Debes indicar un rango de fechas para exportar el informe.");
  }

  const records = await timeControlService.getAdminRecords(user, {
    userId,
    dateFrom,
    dateTo,
  });
  const filteredRecords = filterRecordsByHourRange(records, hourFrom, hourTo);

  if (filteredRecords.length === 0) {
    throw new Error(
      "No hay registros para generar el informe con los filtros seleccionados.",
    );
  }

  const userName =
    filteredRecords[0]?.userName ?? filteredRecords[0]?.userId ?? userId;
  const buffer = timeControlExportService.exportAsXlsxBuffer({
    records: filteredRecords,
    userName,
    dateFrom,
    dateTo,
  });
  const body = new Uint8Array([...buffer]);
  const fileName = sanitizeFileName(
    `control-presencia_${userName}_${dateFrom}_${dateTo}`,
  );

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
    },
  });
});

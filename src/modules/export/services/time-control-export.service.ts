import * as XLSX from "xlsx";
import type { WorkdayRecord } from "../../time-control/domain/types";

interface BuildWorkdayPresenceReportInput {
  records: WorkdayRecord[];
  userName: string;
  dateFrom: string;
  dateTo: string;
}

interface WorkdayPresenceRow {
  Fecha: string;
  Entradas: string;
  Salidas: string;
  Presenciales: string;
  Descanso: string;
}

const formatDurationFromMinutes = (minutes: number): string => {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const formatDateForTitle = (value: string): string => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${year}-${Number(month)}-${Number(day)}`;
};

const formatDateForSheet = (value: string): string => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const formatTimeOnly = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const [, timePart = ""] = value.split(" ");
  return timePart.slice(0, 5) || "-";
};

const buildBreakMinutes = (records: WorkdayRecord[]): number => {
  if (records.length <= 1) {
    return 0;
  }

  let totalBreakMinutes = 0;

  for (let index = 1; index < records.length; index += 1) {
    const previous = records[index - 1];
    const current = records[index];

    if (!previous.checkOutAt) {
      continue;
    }

    const previousDate = new Date(previous.checkOutAt.replace(" ", "T"));
    const currentDate = new Date(current.checkInAt.replace(" ", "T"));
    const diffMinutes = Math.floor(
      (currentDate.getTime() - previousDate.getTime()) / 60000,
    );

    if (Number.isFinite(diffMinutes) && diffMinutes > 0) {
      totalBreakMinutes += diffMinutes;
    }
  }

  return totalBreakMinutes;
};

export class TimeControlExportService {
  private getTotalBreakMinutes(records: WorkdayRecord[]): number {
    const recordsByDate = new Map<string, WorkdayRecord[]>();

    for (const record of records) {
      const current = recordsByDate.get(record.workDate) ?? [];
      current.push(record);
      recordsByDate.set(record.workDate, current);
    }

    return Array.from(recordsByDate.values()).reduce((total, dayRecords) => {
      const orderedRecords = [...dayRecords].sort((left, right) =>
        left.checkInAt.localeCompare(right.checkInAt),
      );
      return total + buildBreakMinutes(orderedRecords);
    }, 0);
  }

  buildDailyRows(input: BuildWorkdayPresenceReportInput): WorkdayPresenceRow[] {
    const recordsByDate = new Map<string, WorkdayRecord[]>();

    for (const record of input.records) {
      const current = recordsByDate.get(record.workDate) ?? [];
      current.push(record);
      recordsByDate.set(record.workDate, current);
    }

    return Array.from(recordsByDate.entries())
      .sort(([leftDate], [rightDate]) => rightDate.localeCompare(leftDate))
      .map(([workDate, records]) => {
        const orderedRecords = [...records].sort((left, right) =>
          left.checkInAt.localeCompare(right.checkInAt),
        );
        const workedMinutes = orderedRecords.reduce(
          (total, record) => total + record.workedMinutes,
          0,
        );
        const breakMinutes = buildBreakMinutes(orderedRecords);
        const entries = orderedRecords
          .map((record) => formatTimeOnly(record.checkInAt))
          .join(" / ");
        const exits = orderedRecords
          .map((record) => formatTimeOnly(record.checkOutAt))
          .join(" / ");

        return {
          Fecha: formatDateForSheet(workDate),
          Entradas: entries || "-",
          Salidas: exits || "-",
          Presenciales: formatDurationFromMinutes(workedMinutes),
          Descanso: formatDurationFromMinutes(breakMinutes),
        };
      });
  }

  exportAsXlsxBuffer(input: BuildWorkdayPresenceReportInput): Uint8Array {
    const rows = this.buildDailyRows(input);
    const totalWorkedMinutes = input.records.reduce(
      (total, record) => total + record.workedMinutes,
      0,
    );

    const sheetRows: Array<Array<string>> = [
      [
        `Informe de ${input.userName} [${formatDateForTitle(
          input.dateFrom,
        )}/${formatDateForTitle(input.dateTo)}] - CETEMET`,
      ],
      [],
      ["Fecha", "Entradas", "Salidas", "Presenciales", "Descanso"],
      ...rows.map((row) => [
        row.Fecha,
        row.Entradas,
        row.Salidas,
        row.Presenciales,
        row.Descanso,
      ]),
      [],
      [
        "TiempoTotal",
        "",
        "",
        formatDurationFromMinutes(totalWorkedMinutes),
        formatDurationFromMinutes(this.getTotalBreakMinutes(input.records)),
      ],
    ];

    const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
    sheet["!cols"] = [
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
    ];

    const sheetRef = sheet["!ref"];
    if (sheetRef) {
      const range = XLSX.utils.decode_range(sheetRef);
      for (let rowIndex = 3; rowIndex <= range.e.r; rowIndex += 1) {
        const presentialCellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 3 });
        const breakCellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 4 });

        if (sheet[presentialCellRef]) {
          sheet[presentialCellRef].s = {
            ...(sheet[presentialCellRef].s ?? {}),
            fill: {
              patternType: "solid",
              fgColor: { rgb: "FFF2CC" },
            },
          };
        }

        if (sheet[breakCellRef]) {
          sheet[breakCellRef].s = {
            ...(sheet[breakCellRef].s ?? {}),
            fill: {
              patternType: "solid",
              fgColor: { rgb: "DDEBF7" },
            },
          };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      "Control de Presencia - Informe",
    );

    return XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as unknown as Uint8Array;
  }
}

export const createTimeControlExportService = () =>
  new TimeControlExportService();

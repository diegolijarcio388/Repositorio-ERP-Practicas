import XLSX from "xlsx-js-style";
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

const MAX_SHEET_NAME_LENGTH = 31;

const formatDurationFromMinutes = (minutes: number): string => {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const formatDateForSheet = (value: string): string => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const buildSheetName = (userName: string): string => {
  const normalized = userName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/*?:[\]]/g, "")
    .trim();

  if (!normalized) {
    return "Control presencia";
  }

  return normalized.slice(0, MAX_SHEET_NAME_LENGTH);
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
    const tableHeaderRowIndex = 4; 
    const summaryRowIndex = tableHeaderRowIndex + rows.length + 2;

    const sheetRows: Array<Array<string>> = [
      ["REPORTE DE CONTROL HORARIO", "", "", "", ""],
      [`Trabajador: ${input.userName}`, "", "", "", ""],
      [`Periodo: ${formatDateForSheet(input.dateFrom)} - ${formatDateForSheet(input.dateTo)}`, "", "", "", ""],
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
        "Tiempo Total", // Corregido el espacio aquí
        "",
        "",
        formatDurationFromMinutes(totalWorkedMinutes),
        formatDurationFromMinutes(this.getTotalBreakMinutes(input.records)),
      ],
    ];

    const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
    sheet["!cols"] = [
      { wch: 16 }, 
      { wch: 20 }, 
      { wch: 20 }, 
      { wch: 16 }, 
      { wch: 14 }, 
    ];
    sheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, 
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, 
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, 
    ];
    
    const lastDataRow = 5 + rows.length;
    sheet["!autofilter"] = {
      ref: `A5:E${lastDataRow}`,
    };

    const sheetRef = sheet["!ref"];
    if (sheetRef) {
      const range = XLSX.utils.decode_range(sheetRef);

      const COLOR_YELLOW_BG = "FEF08A"; 
      const COLOR_BLUE_BG = "DBEAFE";   
      const COLOR_NEUTRAL_BG = "FFFFFF"; 
      const COLOR_TITLE_BG = "F1F5F9";  
      const COLOR_BORDER = "E2E8F0";    

      const BORDER_STYLE = {
        top: { style: "thin", color: { rgb: COLOR_BORDER } },
        bottom: { style: "thin", color: { rgb: COLOR_BORDER } },
        left: { style: "thin", color: { rgb: COLOR_BORDER } },
        right: { style: "thin", color: { rgb: COLOR_BORDER } },
      };

      const getColumnColor = (colIndex: number) => {
        if (colIndex === 1 || colIndex === 2 || colIndex === 3) return COLOR_YELLOW_BG;
        if (colIndex === 4) return COLOR_BLUE_BG;
        return COLOR_NEUTRAL_BG; 
      };

      // 1. Estilizar Títulos Superiores
      const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (sheet[titleCellRef]) {
        sheet[titleCellRef].s = {
          ...(sheet[titleCellRef].s ?? {}),
          font: { bold: true, sz: 16, color: { rgb: "0F172A" } },
          fill: { patternType: "solid", fgColor: { rgb: COLOR_TITLE_BG } },
          alignment: { horizontal: "left", vertical: "center" },
          border: BORDER_STYLE,
        };
      }
      
      const subtitle1Ref = XLSX.utils.encode_cell({ r: 1, c: 0 });
      if (sheet[subtitle1Ref]) {
        sheet[subtitle1Ref].s = {
          ...(sheet[subtitle1Ref].s ?? {}),
          font: { bold: true, color: { rgb: "334155" } },
          fill: { patternType: "solid", fgColor: { rgb: COLOR_TITLE_BG } },
          border: BORDER_STYLE,
        };
      }

      const subtitle2Ref = XLSX.utils.encode_cell({ r: 2, c: 0 });
      if (sheet[subtitle2Ref]) {
        sheet[subtitle2Ref].s = {
          ...(sheet[subtitle2Ref].s ?? {}),
          font: { italic: true, color: { rgb: "64748B" } },
          fill: { patternType: "solid", fgColor: { rgb: COLOR_TITLE_BG } },
          border: BORDER_STYLE,
        };
      }

      // 2. Estilizar Cabecera de Tabla
      for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
        const headerCellRef = XLSX.utils.encode_cell({ r: tableHeaderRowIndex, c: columnIndex });
        if (sheet[headerCellRef]) {
          sheet[headerCellRef].s = {
            ...(sheet[headerCellRef].s ?? {}),
            font: { bold: true, color: { rgb: "0F172A" } },
            fill: {
              patternType: "solid",
              fgColor: { rgb: getColumnColor(columnIndex) },
            },
            alignment: { horizontal: "center", vertical: "center" },
            border: BORDER_STYLE,
          };
        }
      }

      // 3. Estilizar Filas de Datos (Cuerpo)
      for (let rowIndex = tableHeaderRowIndex + 1; rowIndex <= tableHeaderRowIndex + rows.length; rowIndex += 1) {
        for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
          if (sheet[cellRef]) {
            sheet[cellRef].s = {
              ...(sheet[cellRef].s ?? {}),
              fill: {
                patternType: "solid",
                fgColor: { rgb: getColumnColor(columnIndex) },
              },
              alignment: { horizontal: columnIndex === 0 ? "left" : "center", vertical: "center" },
              border: BORDER_STYLE,
            };
          }
        }
      }

      // 4. Estilizar Fila de Resumen (Totales) - CORREGIDO PARA EVITAR CELDAS AMARILLAS VACÍAS
      for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
        const summaryCellRef = XLSX.utils.encode_cell({ r: summaryRowIndex, c: columnIndex });
        if (sheet[summaryCellRef]) {
          // Asignamos colores específicos por celda final en lugar de heredar el de la columna
          let finalBgColor = COLOR_NEUTRAL_BG; 
          if (columnIndex === 0) finalBgColor = COLOR_TITLE_BG; // Gris para "Tiempo Total"
          if (columnIndex === 3) finalBgColor = COLOR_YELLOW_BG; // Amarillo para total Presenciales
          if (columnIndex === 4) finalBgColor = COLOR_BLUE_BG;   // Azul para total Descanso

          sheet[summaryCellRef].s = {
            ...(sheet[summaryCellRef].s ?? {}),
            font: { bold: true, color: { rgb: "0F172A" } },
            fill: {
              patternType: "solid",
              fgColor: { rgb: finalBgColor },
            },
            alignment: { horizontal: columnIndex === 0 ? "left" : "center", vertical: "center" },
            border: BORDER_STYLE,
          };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      buildSheetName(input.userName),
    );

    return XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as unknown as Uint8Array;
  }
}

export const createTimeControlExportService = () =>
  new TimeControlExportService();
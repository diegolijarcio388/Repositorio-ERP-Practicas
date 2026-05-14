import type { CalendarEventType } from "../../vacations/domain/types";

export const forceBlocksSelectionForHoliday = (
  type: CalendarEventType,
  blocksSelection: boolean,
): boolean => {
  if (type === "HOLIDAY") return true;
  return blocksSelection;
};

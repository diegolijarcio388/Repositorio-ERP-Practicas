import type { TimeEntryInput, TimeEntryRecord } from "../types";

export interface TimeEntriesRepository {
  listByYear(year: number): Promise<TimeEntryRecord[]>;
  add(year: number, input: TimeEntryInput): Promise<TimeEntryRecord>;
}

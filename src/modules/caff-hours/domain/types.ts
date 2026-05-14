export const CAFF_SECTIONS = [
  "VARIOS_CAF",
  "REUNION_CAF",
  "INCIDENCIAS_CAF",
] as const;

export type CaffSection = (typeof CAFF_SECTIONS)[number];

export const CAFF_SECTION_LABELS: Record<CaffSection, string> = {
  VARIOS_CAF: "VARIOS CAF",
  REUNION_CAF: "REUNION CAF",
  INCIDENCIAS_CAF: "INCIDENCIAS CAF",
};

export interface CaffTimeEntryRecord {
  id: string;
  userId: string;
  section: CaffSection;
  date: string;
  hours: number;
  description: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaffTimeEntryFilters {
  userId?: string;
  section?: CaffSection;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateCaffTimeEntryInput {
  section: CaffSection;
  date: string;
  hours: number;
  description: string;
}

export interface UpdateCaffTimeEntryInput {
  section?: CaffSection;
  date?: string;
  hours?: number;
  description?: string;
}

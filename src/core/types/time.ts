export const TIME_CATEGORIES = [
  "Analisis",
  "Desarrollo",
  "Soporte",
  "Reunion",
  "Formacion",
] as const;

export type TimeCategory = (typeof TIME_CATEGORIES)[number];

export interface TimeEntryRecord {
  id: string;
  year: number;
  projectId: string;
  userEmail: string;
  date: string;
  hours: number;
  category: TimeCategory;
  description: string;
}

export interface TimeEntryInput {
  projectId: string;
  userEmail: string;
  date: string;
  hours: number;
  category: TimeCategory;
  description: string;
}

import type { TimeEntriesRepository } from "../../../core/ports";
import type { TimeEntryInput, TimeEntryRecord } from "../../../core/types";
import { storage } from "../../../core/storage/storage";

const TIME_STORAGE_KEY = "time_entries_repository_v1";

const timeSeedData: TimeEntryRecord[] = [
  {
    id: "te-1",
    year: 2026,
    projectId: "pr-2026-1",
    userEmail: "admin@example.com",
    date: "2026-01-05",
    hours: 4,
    category: "Analisis",
    description: "Plan inicial",
  },
  {
    id: "te-2",
    year: 2026,
    projectId: "pr-2026-1",
    userEmail: "responsable@example.com",
    date: "2026-01-06",
    hours: 5.5,
    category: "Desarrollo",
    description: "Configuracion base",
  },
  {
    id: "te-3",
    year: 2026,
    projectId: "pr-2026-2",
    userEmail: "tecnico@example.com",
    date: "2026-01-07",
    hours: 3,
    category: "Soporte",
    description: "Soporte incidencia",
  },
  {
    id: "te-4",
    year: 2026,
    projectId: "pr-2026-3",
    userEmail: "admin@example.com",
    date: "2026-01-08",
    hours: 2.5,
    category: "Reunion",
    description: "Comite",
  },
  {
    id: "te-5",
    year: 2026,
    projectId: "pr-2026-3",
    userEmail: "responsable@example.com",
    date: "2026-01-09",
    hours: 6,
    category: "Desarrollo",
    description: "Integracion API",
  },
  {
    id: "te-6",
    year: 2027,
    projectId: "pr-2027-1",
    userEmail: "admin@example.com",
    date: "2027-02-01",
    hours: 3.5,
    category: "Analisis",
    description: "Levantamiento",
  },
  {
    id: "te-7",
    year: 2027,
    projectId: "pr-2027-1",
    userEmail: "responsable@example.com",
    date: "2027-02-02",
    hours: 7,
    category: "Desarrollo",
    description: "Sprint 1",
  },
  {
    id: "te-8",
    year: 2027,
    projectId: "pr-2027-2",
    userEmail: "tecnico@example.com",
    date: "2027-02-03",
    hours: 2,
    category: "Formacion",
    description: "Capacitacion equipo",
  },
  {
    id: "te-9",
    year: 2027,
    projectId: "pr-2027-2",
    userEmail: "admin@example.com",
    date: "2027-02-04",
    hours: 5,
    category: "Soporte",
    description: "Correcciones",
  },
  {
    id: "te-10",
    year: 2027,
    projectId: "pr-2027-1",
    userEmail: "responsable@example.com",
    date: "2027-02-05",
    hours: 4.25,
    category: "Reunion",
    description: "Seguimiento",
  },
];

const readEntries = (): TimeEntryRecord[] => {
  const storedEntries = storage.get<TimeEntryRecord[]>(TIME_STORAGE_KEY, []);
  if (storedEntries.length > 0) return storedEntries;
  storage.set(TIME_STORAGE_KEY, timeSeedData);
  return timeSeedData;
};

const writeEntries = (entries: TimeEntryRecord[]) =>
  storage.set(TIME_STORAGE_KEY, entries);

class LocalTimeEntriesRepository implements TimeEntriesRepository {
  async listByYear(year: number): Promise<TimeEntryRecord[]> {
    return readEntries().filter((entry) => entry.year === year);
  }

  async add(year: number, input: TimeEntryInput): Promise<TimeEntryRecord> {
    if (input.hours < 0.25 || input.hours > 12) {
      throw new Error("Las horas por entrada deben estar entre 0.25 y 12.");
    }

    const entries = readEntries();
    const dayHours = entries
      .filter(
        (entry) =>
          entry.year === year &&
          entry.date === input.date &&
          entry.userEmail === input.userEmail,
      )
      .reduce((acc, entry) => acc + entry.hours, 0);
    if (dayHours + input.hours > 24) {
      throw new Error("El total diario no puede superar 24 horas.");
    }

    const created: TimeEntryRecord = {
      id: `te-${year}-${crypto.randomUUID()}`,
      year,
      projectId: input.projectId,
      userEmail: input.userEmail,
      date: input.date,
      hours: input.hours,
      category: input.category,
      description: input.description.trim(),
    };

    entries.push(created);
    writeEntries(entries);
    return created;
  }
}

export const createTimeEntriesRepository = (): TimeEntriesRepository =>
  new LocalTimeEntriesRepository();

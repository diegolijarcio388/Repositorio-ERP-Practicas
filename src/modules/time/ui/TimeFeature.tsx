import { useEffect, useMemo, useState } from "react";
import { getContainer } from "../../../core/di/container";
import {
  notifyTimeEntriesChange,
  subscribeTimeEntriesChange,
} from "../../../core/time/time-entries-context";
import { getYear, subscribeYearChange } from "../../../core/year/year-context";
import type {
  ProjectRecord,
  TimeEntryInput,
  TimeEntryRecord,
  UserSession,
  Year,
} from "../../../core/types";
import { Button, Select, Toast } from "../../../shared/ui";
import { getStartOfWeekIso, getWeekDays } from "../../../shared/utils/date";
import { TimeEntriesTable } from "./TimeEntriesTable";
import { TimeEntryModal } from "./TimeEntryModal";
import { WeekPicker } from "./WeekPicker";
import { WeeklyTotals } from "./WeeklyTotals";

interface TimeFeatureProps {
  session: UserSession;
  mode: "manager" | "worker";
  showAddButton?: boolean;
}

const inSelectedWeek = (date: string, weekStart: string): boolean => {
  const weekDays = new Set(getWeekDays(weekStart));
  return weekDays.has(date);
};

export function TimeFeature({
  session,
  mode,
  showAddButton = true,
}: TimeFeatureProps) {
  const container = useMemo(() => getContainer(), []);
  const canFilterUsers =
    mode === "manager" &&
    (session.role === "Admin" || session.role === "Responsable");
  const [year, setYear] = useState<Year>(getYear());
  const [weekStart, setWeekStart] = useState(getStartOfWeekIso(new Date()));
  const [entries, setEntries] = useState<TimeEntryRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState(session.email);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const loadData = async (targetYear: number) => {
    const [loadedEntries, loadedProjects] = await Promise.all([
      container.timeEntries.listByYear(targetYear),
      container.projects.listByYear(targetYear),
    ]);

    if (mode === "worker") {
      const assignments = await container.assignments.listByUser(
        targetYear,
        session.email,
      );
      const assignedProjectIds = new Set(
        assignments.map((assignment) => assignment.projectId),
      );
      setProjects(
        loadedProjects.filter((project) => assignedProjectIds.has(project.id)),
      );
    } else {
      setProjects(loadedProjects);
    }

    setEntries(loadedEntries);
  };

  useEffect(() => {
    loadData(year);
  }, [year, mode, session.email]);

  useEffect(() => {
    return subscribeTimeEntriesChange((changedYear) => {
      if (changedYear === year) {
        loadData(year);
      }
    });
  }, [year, mode, session.email]);

  useEffect(() => {
    return subscribeYearChange((nextYear) => setYear(nextYear));
  }, []);

  useEffect(() => {
    if (!canFilterUsers) setSelectedUser(session.email);
  }, [canFilterUsers, session.email]);

  const allUsers = useMemo(() => {
    const users = new Set(entries.map((entry) => entry.userEmail));
    users.add(session.email);
    return Array.from(users);
  }, [entries, session.email]);

  const weekEntries = entries
    .filter((entry) => inSelectedWeek(entry.date, weekStart))
    .filter((entry) =>
      canFilterUsers
        ? entry.userEmail === selectedUser
        : entry.userEmail === session.email,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleAddEntry = async (input: TimeEntryInput) => {
    try {
      await container.timeEntryPolicy.add(year, input);
      await loadData(year);
      notifyTimeEntriesChange(year);
      setToast({ tone: "success", message: "Entrada registrada." });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la entrada.";
      setToast({ tone: "error", message: errorMessage });
      throw error;
    }
  };

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {mode === "manager"
              ? `Partes de horas (equipo) ${year}`
              : `Mis partes de horas ${year}`}
          </h2>
          {showAddButton ? (
            <Button onClick={() => setModalOpen(true)}>Añadir horas</Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <WeekPicker weekStart={weekStart} onChange={setWeekStart} />
          {canFilterUsers ? (
            <div className="w-[250px]">
              <Select
                label="Usuario"
                value={selectedUser}
                onChange={(event) => setSelectedUser(event.target.value)}
                options={allUsers.map((email) => ({
                  label: email,
                  value: email,
                }))}
              />
            </div>
          ) : null}
        </div>
        <TimeEntriesTable entries={weekEntries} projects={projects} />
        <WeeklyTotals entries={weekEntries} />
      </section>
      <TimeEntryModal
        open={modalOpen}
        projects={projects}
        defaultUserEmail={session.email}
        users={allUsers}
        canSelectUser={canFilterUsers}
        onClose={() => setModalOpen(false)}
        onSave={handleAddEntry}
      />
      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onDone={() => setToast(null)}
        />
      ) : null}
    </>
  );
}

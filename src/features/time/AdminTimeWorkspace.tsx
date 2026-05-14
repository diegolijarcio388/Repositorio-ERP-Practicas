import type { UserSession } from "../../core/types";
import { TimeFeature } from "../../modules/time";

interface AdminTimeWorkspaceProps {
  session: UserSession;
}

export function AdminTimeWorkspace({ session }: AdminTimeWorkspaceProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Vista de gestion de horas</h2>
        <p className="mt-1 text-sm text-slate-600">
          Puedes registrar horas y filtrar por usuario para seguimiento del
          equipo.
        </p>
      </div>
      <TimeFeature session={session} mode="manager" />
    </section>
  );
}

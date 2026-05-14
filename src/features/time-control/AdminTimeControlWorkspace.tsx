import type { UserSession } from "../../core/types";
import { TimeControlFeature } from "../../modules/time-control/ui/TimeControlFeature";

interface AdminTimeControlWorkspaceProps {
  session: UserSession;
}

export function AdminTimeControlWorkspace({
  session,
}: AdminTimeControlWorkspaceProps) {
  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">
          Gestión de control horario
        </h2>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-600">
          Revisa solicitudes, controla incidencias y sigue el estado diario del
          equipo desde un único panel de gestión.
        </p>
      </div>
      <TimeControlFeature session={session} mode="manager" />
    </section>
  );
}

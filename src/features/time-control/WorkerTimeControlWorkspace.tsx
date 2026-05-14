import type { UserSession } from "../../core/types";
import { TimeControlFeature } from "../../modules/time-control/ui/TimeControlFeature";

interface WorkerTimeControlWorkspaceProps {
  session: UserSession;
}

export function WorkerTimeControlWorkspace({
  session,
}: WorkerTimeControlWorkspaceProps) {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Mi control horario
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Desde aquí puedes registrar tu entrada, tu salida y consultar tu
          historial de jornadas.
        </p>
      </div>
      <TimeControlFeature session={session} mode="worker" />
    </section>
  );
}

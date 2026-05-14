import type { UserSession } from "../../core/types";
import { TimeControlFeature } from "../../modules/time-control/ui/TimeControlFeature";

interface WorkerTimeControlRequestsWorkspaceProps {
  session: UserSession;
}

export function WorkerTimeControlRequestsWorkspace({
  session,
}: WorkerTimeControlRequestsWorkspaceProps) {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Solicitudes de control horario
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Aquí puedes revisar el estado de tus regularizaciones y las notas de
          revisión asociadas.
        </p>
      </div>
      <TimeControlFeature session={session} mode="worker" workerView="requests" />
    </section>
  );
}

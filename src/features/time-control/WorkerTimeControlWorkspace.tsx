import { useState } from "react";
import type { UserSession } from "../../core/types";
import { TimeControlFeature } from "../../modules/time-control/ui/TimeControlFeature";

interface WorkerTimeControlWorkspaceProps {
  session: UserSession;
}

type WorkerTab = "overview" | "requests";

export function WorkerTimeControlWorkspace({
  session,
}: WorkerTimeControlWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkerTab>("overview");

  const description =
    activeTab === "overview"
      ? "Desde aquí puedes registrar tu entrada, tu salida y consultar tu historial de jornadas."
      : "Aquí puedes revisar el estado de tus regularizaciones y las notas de revisión asociadas.";

  const tabButtonClasses = (tab: WorkerTab) =>
    `flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
      activeTab === tab
        ? "bg-slate-900 text-white shadow-sm"
        : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <TimeControlFeature
        session={session}
        mode="worker"
        workerView={activeTab}
        headerSlot={
          <div className="space-y-4">
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Mi control horario
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                {description}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={tabButtonClasses("overview")}
                >
                  Mi control horario
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("requests")}
                  className={tabButtonClasses("requests")}
                >
                  Mis solicitudes
                </button>
              </div>
            </div>
          </div>
        }
      />
    </section>
  );
}

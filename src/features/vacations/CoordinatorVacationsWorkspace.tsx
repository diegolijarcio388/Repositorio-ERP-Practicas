import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Table, Toast } from "../../shared/ui";
import { vacationsApi } from "../../modules/vacations/services/vacations.api";
import { DayMultiSelect } from "../../modules/vacations/ui/DayMultiSelect";
import type { UserSession } from "../../core/types";
import type { VacationRequestRecord } from "../../modules/vacations/domain/types";

interface CoordinatorVacationsWorkspaceProps {
  session: UserSession;
  departmentId?: string;
  departmentName?: string;
  responsibleName?: string;
}

const getRequestNumber = (requestId: string): string => {
  const short = requestId.replace(/^vreq-/, "").slice(0, 8).toUpperCase();
  return `SOL-${short || requestId.slice(0, 8).toUpperCase()}`;
};

export function CoordinatorVacationsWorkspace({
  session,
  departmentId,
  departmentName,
  responsibleName,
}: CoordinatorVacationsWorkspaceProps) {
  const [items, setItems] = useState<VacationRequestRecord[]>([]);
  const [usersById, setUsersById] = useState<Map<string, string>>(new Map());
  const [blocks, setBlocks] = useState<Array<{ id: string; days: string[] | null; reason: string | null }>>(
    [],
  );
  const [selectedBlockDays, setSelectedBlockDays] = useState<string[]>([]);
  const [blockReason, setBlockReason] = useState("");
  const [actionComment, setActionComment] = useState("");
  const [actionModal, setActionModal] = useState<{
    type: "approve" | "reject";
    requestId: string;
    worker: string;
    days: string[];
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    requestId: string;
    worker: string;
    days: string[];
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(
    null,
  );
  const dateFrom = "2026-01-01";
  const dateTo = "2026-12-31";

  const blockToDays = (block: { days: string[] | null }): string[] => block.days ?? [];

  const statusMeta: Record<VacationRequestRecord["status"], { label: string; classes: string }> = {
    PENDING: {
      label: "Pendiente",
      classes: "bg-amber-100 text-amber-800 ring-amber-200",
    },
    PENDING_ADMIN: {
      label: "Pendiente de administración",
      classes: "bg-sky-100 text-sky-800 ring-sky-200",
    },
    CHANGE_PENDING_COORDINATOR: {
      label: "Cambio pendiente de coordinador",
      classes: "bg-violet-100 text-violet-800 ring-violet-200",
    },
    CHANGE_PENDING_ADMIN: {
      label: "Cambio pendiente de administración",
      classes: "bg-indigo-100 text-indigo-800 ring-indigo-200",
    },
    APPROVED: {
      label: "Aprobada",
      classes: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    },
    REJECTED: {
      label: "Rechazada",
      classes: "bg-rose-100 text-rose-800 ring-rose-200",
    },
    CANCELLED: {
      label: "Cancelada",
      classes: "bg-slate-100 text-slate-700 ring-slate-200",
    },
  };

  const load = async () => {
    const [data, currentBlocks, users] = await Promise.all([
      vacationsApi.listDepartment({ departmentId }),
      vacationsApi.listBlocks(departmentId),
      vacationsApi.listUsers(departmentId),
    ]);
    setItems(data);
    setBlocks(
      currentBlocks.map((block) => ({
        id: block.id,
        days: block.days,
        reason: block.reason,
      })),
    );
    setUsersById(new Map(users.map((user) => [user.id, user.name])));
  };

  useEffect(() => {
    void load();
  }, [departmentId]);

  const confirmAction = async () => {
    if (!actionModal) return;
    try {
      if (actionModal.type === "approve") {
        await vacationsApi.approve(actionModal.requestId, actionComment.trim() || undefined);
        setToast({ message: "Solicitud aprobada.", tone: "success" });
      } else {
        await vacationsApi.reject(actionModal.requestId, actionComment.trim() || undefined);
        setToast({ message: "Solicitud rechazada.", tone: "success" });
      }
      setActionModal(null);
      setActionComment("");
      await load();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : actionModal.type === "approve"
              ? "Error al aprobar"
              : "Error al rechazar",
        tone: "error",
      });
    }
  };

  const closeActionModal = () => {
    setActionModal(null);
    setActionComment("");
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  const confirmDeleteCancelled = async () => {
    if (!deleteModal) return;
    try {
      await vacationsApi.deleteCancelledAsManager(deleteModal.requestId);
      closeDeleteModal();
      setToast({ message: "Solicitud cancelada eliminada.", tone: "success" });
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al eliminar solicitud",
        tone: "error",
      });
    }
  };

  const createBlock = async () => {
    if (selectedBlockDays.length === 0) return;
    try {
      await vacationsApi.createBlock({
        departmentId,
        days: selectedBlockDays,
        reason: blockReason.trim() || undefined,
      });
      setSelectedBlockDays([]);
      setBlockReason("");
      setToast({ message: "Bloqueo creado.", tone: "success" });
      await load();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al crear bloqueo",
        tone: "error",
      });
    }
  };

  const deleteBlock = async (id: string) => {
    await vacationsApi.deleteBlock(id);
    await load();
  };

  const blockedDays = useMemo(() => {
    const result = new Set<string>();
    for (const block of blocks) {
      for (const day of blockToDays(block)) {
        if (day >= dateFrom && day <= dateTo) result.add(day);
      }
    }
    return result;
  }, [blocks]);

  const blockReasonByDay = useMemo(() => {
    const result = new Map<string, string[]>();
    for (const block of blocks) {
      if (!block.reason?.trim()) continue;
      for (const day of blockToDays(block)) {
        const current = result.get(day) ?? [];
        current.push(`BLOQUEO: ${block.reason}`);
        result.set(day, current);
      }
    }
    return result;
  }, [blocks]);

  const visibleItems = useMemo(
    () => items.filter((request) => request.status !== "APPROVED"),
    [items],
  );

  return (
    <section className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-semibold">
          {departmentName ? `Vacaciones de ${departmentName}` : "Vacaciones de Departamento"}
        </h1>
        <p className="text-sm text-slate-600">
          Responsable: {responsibleName?.trim() || session.displayName}
        </p>
      </header>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Solicitudes</h2>
        {visibleItems.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No hay solicitudes pendientes.
          </p>
        ) : (
          <Table headers={["Nº solicitud", "Trabajador", "Dias", "Total", "Estado", "Acciones"]}>
            {visibleItems.map((request) => (
              <tr key={request.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{getRequestNumber(request.id)}</td>
                <td className="px-4 py-3">{usersById.get(request.userId) ?? request.userId}</td>
                <td className="px-4 py-3">
                  {request.status === "CHANGE_PENDING_COORDINATOR" ||
                  request.status === "CHANGE_PENDING_ADMIN" ? (
                    <div className="space-y-1">
                      {request.requestType === "HOURLY" ? (
                        <>
                          <p>
                            Actual:{" "}
                            {request.hourRanges
                              .map((range) => `${range.day} ${range.startTime}-${range.endTime}`)
                              .join(", ")}
                          </p>
                          <p>
                            Propuesta:{" "}
                            {(request.proposedHourRanges ?? [])
                              .map((range) => `${range.day} ${range.startTime}-${range.endTime}`)
                              .join(", ")}
                          </p>
                        </>
                      ) : (
                        <>
                          <p>Actual: {request.days.join(", ")}</p>
                          <p>Propuesta: {(request.proposedDays ?? []).join(", ")}</p>
                        </>
                      )}
                      <p className="text-xs text-slate-500">
                        Motivo: {request.changeRequestComment ?? "-"}
                      </p>
                    </div>
                  ) : (
                    request.requestType === "HOURLY"
                      ? request.hourRanges
                          .map((range) => `${range.day} ${range.startTime}-${range.endTime}`)
                          .join(", ")
                      : request.days.join(", ")
                  )}
                </td>
                <td className="px-4 py-3">
                  {request.requestType === "HOURLY" ? `${request.hoursTotal}h` : request.days.length}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta[request.status].classes}`}
                  >
                    {statusMeta[request.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {request.status === "PENDING" || request.status === "CHANGE_PENDING_COORDINATOR" ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setActionModal({
                            type: "approve",
                            requestId: request.id,
                            worker: usersById.get(request.userId) ?? request.userId,
                            days:
                              request.status === "CHANGE_PENDING_COORDINATOR"
                                ? (request.proposedDays ?? [])
                                : request.days,
                          })
                        }
                        type="button"
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() =>
                          setActionModal({
                            type: "reject",
                            requestId: request.id,
                            worker: usersById.get(request.userId) ?? request.userId,
                            days:
                              request.status === "CHANGE_PENDING_COORDINATOR"
                                ? (request.proposedDays ?? [])
                                : request.days,
                          })
                        }
                        type="button"
                      >
                        Rechazar
                      </Button>
                    </div>
                  ) : request.status === "CANCELLED" ? (
                    <Button
                      variant="danger"
                      onClick={() =>
                        setDeleteModal({
                          requestId: request.id,
                          worker: usersById.get(request.userId) ?? request.userId,
                          days: request.days,
                        })
                      }
                      type="button"
                    >
                      Eliminar
                    </Button>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Bloqueos actuales</h2>
        <ul className="space-y-2 text-sm">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center justify-between gap-4 rounded border border-slate-200 bg-slate-50 p-3"
            >
              <div>
                <p>{block.days?.join(", ") ?? block.id}</p>
                <p className="text-xs text-slate-500">{block.reason || "Sin comentario"}</p>
              </div>
              <Button variant="danger" onClick={() => void deleteBlock(block.id)}>
                Eliminar
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Bloqueos de departamento</h2>
        <p className="mb-4 text-sm text-slate-600">
          Selecciona uno o varios dias en el calendario para crear bloqueos.
        </p>
        <DayMultiSelect
          blockedDays={blockedDays}
          holidayDays={new Set<string>()}
          pendingDays={new Set<string>()}
          approvedDays={new Set<string>()}
          eventTitlesByDay={blockReasonByDay}
          selectedDays={selectedBlockDays}
          restrictPast={false}
          onChange={setSelectedBlockDays}
        />
        {selectedBlockDays.length > 0 ? (
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">
                Comentario del bloqueo (opcional)
              </span>
              <textarea
                value={blockReason}
                onChange={(event) => setBlockReason(event.target.value)}
                className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
                placeholder="Ejemplo: cierre operativo del area"
              />
            </label>
          </div>
        ) : null}
      </div>
      {selectedBlockDays.length > 0 ? (
        <div className="fixed inset-x-0 bottom-8 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-xs flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white/95 px-3 py-5 shadow-lg backdrop-blur">
            <Button onClick={() => void createBlock()} type="button">
              Confirmar bloqueo
            </Button>
            <p className="text-sm text-slate-700">
              Dias seleccionados: <strong>{selectedBlockDays.length}</strong>
            </p>
          </div>
        </div>
      ) : null}
      <Modal
        open={Boolean(actionModal)}
        title={actionModal?.type === "approve" ? "Confirmar aprobacion" : "Confirmar rechazo"}
        onClose={closeActionModal}
      >
        {actionModal ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Trabajador: <strong>{actionModal.worker}</strong>
            </p>
            <p className="text-sm text-slate-700">Dias: {actionModal.days.join(", ")}</p>
            <p className="text-sm text-slate-700">Total dias: {actionModal.days.length}</p>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">
                Comentario para el trabajador (opcional)
              </span>
              <textarea
                value={actionComment}
                onChange={(event) => setActionComment(event.target.value)}
                className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
              />
            </label>
            <div className="flex gap-2">
              <Button
                variant={actionModal.type === "approve" ? "primary" : "danger"}
                onClick={() => void confirmAction()}
                type="button"
              >
                {actionModal.type === "approve" ? "Confirmar aprobacion" : "Confirmar rechazo"}
              </Button>
              <Button variant="primary" onClick={closeActionModal} type="button">
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(deleteModal)}
        title="Eliminar solicitud cancelada"
        onClose={closeDeleteModal}
      >
        {deleteModal ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-700">
              Trabajador: <strong>{deleteModal.worker}</strong>
            </p>
            <p className="text-sm font-medium text-slate-800">Dias: {deleteModal.days.join(", ")}</p>
            <p className="text-sm text-slate-700">Total dias: {deleteModal.days.length}</p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-sm font-medium text-amber-900">
                Esta accion eliminara definitivamente la solicitud.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="danger" onClick={() => void confirmDeleteCancelled()} type="button">
                Eliminar solicitud
              </Button>
              <Button variant="primary" onClick={closeDeleteModal} type="button">
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
      {toast ? (
        <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />
      ) : null}
    </section>
  );
}

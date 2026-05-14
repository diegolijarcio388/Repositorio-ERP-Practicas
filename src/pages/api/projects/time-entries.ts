import type { APIRoute } from "astro";
import { parseJsonBody, withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";
import {
  listProjectTimeEntries,
  listPendingProjectTimeEntriesForManager,
  createProjectTimeEntry,
  approveProjectTimeEntry,
  rejectProjectTimeEntry,
  updateProjectTimeEntry,
  deleteProjectTimeEntry,
  listInternalTimeEntries,
  createInternalTimeEntry,
  updateInternalTimeEntry,
  deleteInternalTimeEntry,
} from "../../../modules/projects/services/time-entries.service";
import type {
  CreateProjectTimeEntryInput,
  CreateInternalTimeEntryInput,
  ProjectTimeEntryFilters,
  InternalTimeEntryFilters,
  TimeEntryReviewStatus,
  UpdateProjectTimeEntryInput,
  UpdateInternalTimeEntryInput,
} from "../../../modules/projects/domain/types";

// GET  /api/projects/time-entries?type=project|internal&projectId=&userId=&taskName=&dateFrom=&dateTo=
export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const params = context.url.searchParams;
  const type = params.get("type") ?? "project";

  if (type === "internal") {
    const filters: InternalTimeEntryFilters = {
      userId: params.get("userId") ?? undefined,
      dateFrom: params.get("dateFrom") ?? undefined,
      dateTo: params.get("dateTo") ?? undefined,
    };
    const items = await listInternalTimeEntries(user, filters);
    return jsonOk({ items });
  }

  const filters: ProjectTimeEntryFilters = {
    userId: params.get("userId") ?? undefined,
    projectId: params.get("projectId") ?? undefined,
    taskId: params.get("taskId") ?? undefined,
    taskName: params.get("taskName") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
    reviewStatus: (params.get("reviewStatus") as TimeEntryReviewStatus | null) ?? undefined,
  };
  if (params.get("view") === "pending") {
    const items = await listPendingProjectTimeEntriesForManager(user);
    return jsonOk({ items });
  }
  const items = await listProjectTimeEntries(user, filters);
  return jsonOk({ items });
});

// POST /api/projects/time-entries
// body: { type: "project", ...CreateProjectTimeEntryInput }
//     | { type: "internal", ...CreateInternalTimeEntryInput }
export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await parseJsonBody<
    | ({ type: "project" } & CreateProjectTimeEntryInput)
    | ({ type: "internal" } & CreateInternalTimeEntryInput)
  >(context.request);

  if (body.type === "internal") {
    const entry = await createInternalTimeEntry(user, body);
    return jsonOk({ item: entry }, 201);
  }

  const entry = await createProjectTimeEntry(user, body);
  return jsonOk({ item: entry }, 201);
});

// PATCH /api/projects/time-entries
// body: { type: "project"|"internal", id: string, ...update fields }
export const PATCH: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await parseJsonBody<
    | ({ type: "project"; action: "update"; id: string } & UpdateProjectTimeEntryInput)
    | { type: "project"; action: "approve"; id: string }
    | { type: "project"; action: "reject"; id: string; reason: string }
    | ({ type: "internal"; id: string } & UpdateInternalTimeEntryInput)
  >(context.request);

  if (body.type === "internal") {
    const { type: _, id, ...fields } = body;
    const entry = await updateInternalTimeEntry(user, id, fields);
    return jsonOk({ item: entry });
  }

  if (body.action === "approve") {
    const entry = await approveProjectTimeEntry(user, body.id);
    return jsonOk({ item: entry });
  }

  if (body.action === "reject") {
    const entry = await rejectProjectTimeEntry(user, body.id, body.reason);
    return jsonOk({ item: entry });
  }

  const { type: _, action: __, id, ...fields } = body as { type: "project"; action: "update"; id: string } & UpdateProjectTimeEntryInput;
  const entry = await updateProjectTimeEntry(user, id, fields);
  return jsonOk({ item: entry });
});

// DELETE /api/projects/time-entries?type=project|internal&id=
export const DELETE: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const params = context.url.searchParams;
  const type = params.get("type") ?? "project";
  const id = params.get("id");
  if (!id) throw new Error("id es requerido.");

  if (type === "internal") {
    await deleteInternalTimeEntry(user, id);
  } else {
    await deleteProjectTimeEntry(user, id);
  }
  return jsonOk({ ok: true });
});

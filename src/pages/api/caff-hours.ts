import type { APIRoute } from "astro";
import { parseJsonBody, withApiError } from "../../core/server/api-handler";
import { jsonOk } from "../../core/server/api-response";
import { requireApiUser } from "../../modules/rbac/services/api-auth";
import {
  createCaffTimeEntry,
  deleteCaffTimeEntry,
  listCaffTimeEntries,
  updateCaffTimeEntry,
} from "../../modules/caff-hours/services/caff-hours.service";
import type {
  CaffSection,
  CreateCaffTimeEntryInput,
  UpdateCaffTimeEntryInput,
} from "../../modules/caff-hours/domain/types";

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const params = context.url.searchParams;
  const items = await listCaffTimeEntries(user, {
    section: (params.get("section") as CaffSection | null) ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
  });
  return jsonOk({ items });
});

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await parseJsonBody<CreateCaffTimeEntryInput>(context.request);
  const item = await createCaffTimeEntry(user, body);
  return jsonOk({ item }, 201);
});

export const PATCH: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await parseJsonBody<{ id: string } & UpdateCaffTimeEntryInput>(context.request);
  const item = await updateCaffTimeEntry(user, body.id, body);
  return jsonOk({ item });
});

export const DELETE: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const id = context.url.searchParams.get("id");
  if (!id) throw new Error("id es requerido.");
  await deleteCaffTimeEntry(user, id);
  return jsonOk({ ok: true });
});

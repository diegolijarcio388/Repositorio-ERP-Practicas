import type { APIRoute } from "astro";
import { parseJsonBody, withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser, ensureRole } from "../../../modules/rbac/services/api-auth";
import {
  listMyExpenses,
  listPendingExpensesForManager,
  listExpensesByProject,
  createExpense,
  approveExpense,
  rejectExpense,
} from "../../../modules/projects/services/expenses.service";
import type { CreateExpenseInput } from "../../../modules/projects/domain/types";

// GET  /api/projects/expenses?view=my|pending|project&projectId=
export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const view = context.url.searchParams.get("view") ?? "my";

  if (view === "pending") {
    ensureRole(user, ["admin", "coordinator"]);
    const items = await listPendingExpensesForManager(user);
    return jsonOk({ items });
  }

  if (view === "project") {
    const projectId = context.url.searchParams.get("projectId");
    if (!projectId) throw new Error("projectId es requerido.");
    const items = await listExpensesByProject(user, projectId);
    return jsonOk({ items });
  }

  const items = await listMyExpenses(user);
  return jsonOk({ items });
});

// POST /api/projects/expenses
export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const body = await parseJsonBody<CreateExpenseInput>(context.request);
  const expense = await createExpense(user, body);
  return jsonOk({ item: expense }, 201);
});

// PATCH /api/projects/expenses
// body: { action: "approve"|"reject"; id: string; reason?: string }
export const PATCH: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin", "coordinator"]);
  const body = await parseJsonBody<
    { action: "approve"; id: string } | { action: "reject"; id: string; reason: string }
  >(context.request);

  if (body.action === "approve") {
    const expense = await approveExpense(user, body.id);
    return jsonOk({ item: expense });
  }

  const expense = await rejectExpense(user, body.id, body.reason);
  return jsonOk({ item: expense });
});

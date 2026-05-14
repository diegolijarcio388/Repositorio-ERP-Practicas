import type { APIRoute } from "astro";
import { parseJsonBody, withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser, ensureRole } from "../../../modules/rbac/services/api-auth";
import { listProjects, createProject } from "../../../modules/projects/services/projects.service";
import type { CreateProjectInput } from "../../../modules/projects/domain/types";

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const projects = await listProjects(user);
  return jsonOk({ items: projects });
});

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin", "coordinator"]);
  const body = await parseJsonBody<CreateProjectInput>(context.request);
  const project = await createProject(user, body);
  return jsonOk({ item: project }, 201);
});

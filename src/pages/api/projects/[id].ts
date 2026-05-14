import type { APIRoute } from "astro";
import { parseJsonBody, withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser, ensureRole } from "../../../modules/rbac/services/api-auth";
import {
  getProjectDetail,
  getProjectWorkerView,
  updateProject,
  deleteProject,
  addWorkPackage,
  addTask,
  addBudgetPartition,
  assignUsersToProject,
  removeUserFromProject,
  assignUserToTask,
  removeUserFromTask,
  addHourBagEntry,
  updateHourBagEntry,
  deleteHourBagEntry,
  workerLogHourBagEntry,
  approveHourBagEntry,
  rejectHourBagEntry,
} from "../../../modules/projects/services/projects.service";
import type {
  CreateProjectHourBagEntryInput,
  UpdateProjectInput,
  CreateWorkPackageInput,
  CreateTaskInput,
  CreateBudgetPartitionInput,
  UpdateProjectHourBagEntryInput,
} from "../../../modules/projects/domain/types";

export const GET: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const { id } = context.params;
  const project =
    user.role === "worker"
      ? await getProjectWorkerView(user, id!)
      : await getProjectDetail(user, id!);
  return jsonOk({ item: project });
});

export const PATCH: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin", "coordinator"]);
  const { id } = context.params;
  const body = await parseJsonBody<UpdateProjectInput>(context.request);
  const project = await updateProject(user, id!, body);
  return jsonOk({ item: project });
});

export const DELETE: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  ensureRole(user, ["admin", "coordinator"]);
  const { id } = context.params;
  await deleteProject(user, id!);
  return jsonOk({ ok: true });
});

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const { id } = context.params;

  const body = await parseJsonBody<
    | { action: "add_work_package"; workPackage: CreateWorkPackageInput }
    | { action: "add_task"; workPackageId: string | null; task: CreateTaskInput }
    | { action: "add_budget_partition"; partition: CreateBudgetPartitionInput }
    | { action: "assign_users"; userIds: string[] }
    | { action: "remove_user"; userId: string }
    | { action: "assign_task"; taskId: string; userId: string }
    | { action: "remove_task_assignment"; taskId: string; userId: string }
    | { action: "add_hour_bag_entry"; entry: CreateProjectHourBagEntryInput; assignedUserIds: string[] }
    | { action: "update_hour_bag_entry"; entryId: string; entry: UpdateProjectHourBagEntryInput }
    | { action: "delete_hour_bag_entry"; entryId: string }
    | { action: "worker_log_hour_bag_entry"; entryId: string; hours: number; date?: string }
    | { action: "approve_hour_bag_entry"; entryId: string }
    | { action: "reject_hour_bag_entry"; entryId: string; reason: string }
  >(context.request);

  switch (body.action) {
    case "add_work_package":
      ensureRole(user, ["admin", "coordinator"]);
      await addWorkPackage(user, id!, body.workPackage);
      break;
    case "add_task":
      ensureRole(user, ["admin", "coordinator"]);
      await addTask(user, id!, body.workPackageId, body.task);
      break;
    case "add_budget_partition":
      ensureRole(user, ["admin", "coordinator"]);
      await addBudgetPartition(user, id!, body.partition);
      break;
    case "assign_users":
      ensureRole(user, ["admin", "coordinator"]);
      await assignUsersToProject(user, id!, body.userIds);
      break;
    case "remove_user":
      ensureRole(user, ["admin", "coordinator"]);
      await removeUserFromProject(user, id!, body.userId);
      break;
    case "assign_task":
      ensureRole(user, ["admin", "coordinator"]);
      await assignUserToTask(user, id!, body.taskId, body.userId);
      break;
    case "remove_task_assignment":
      ensureRole(user, ["admin", "coordinator"]);
      await removeUserFromTask(user, id!, body.taskId, body.userId);
      break;
    case "add_hour_bag_entry":
      ensureRole(user, ["admin", "coordinator"]);
      await addHourBagEntry(user, id!, body.entry, body.assignedUserIds);
      break;
    case "update_hour_bag_entry":
      ensureRole(user, ["admin", "coordinator"]);
      await updateHourBagEntry(user, id!, body.entryId, body.entry);
      break;
    case "delete_hour_bag_entry":
      ensureRole(user, ["admin", "coordinator"]);
      await deleteHourBagEntry(user, id!, body.entryId);
      break;
    case "worker_log_hour_bag_entry":
      ensureRole(user, ["worker"]);
      await workerLogHourBagEntry(user, id!, body.entryId, {
        hours: body.hours,
        date: body.date,
      });
      break;
    case "approve_hour_bag_entry":
      ensureRole(user, ["admin", "coordinator"]);
      await approveHourBagEntry(user, id!, body.entryId);
      break;
    case "reject_hour_bag_entry":
      ensureRole(user, ["admin", "coordinator"]);
      await rejectHourBagEntry(user, id!, body.entryId, body.reason);
      break;
    default:
      throw new Error("Accion no reconocida.");
  }

  const updated =
    user.role === "worker"
      ? await getProjectWorkerView(user, id!)
      : await getProjectDetail(user, id!);
  return jsonOk({ item: updated });
});

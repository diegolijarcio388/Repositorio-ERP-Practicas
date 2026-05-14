import { getMySqlPool } from "../../../core/db/mysql";
import type {
  BudgetPartitionRecord,
  CreateProjectInput,
  CreateProjectHourBagEntryInput,
  CreateWorkPackageInput,
  HourBagReviewStatus,
  HourTrackingMode,
  ProjectAssignmentRecord,
  ProjectHourBagEntryRecord,
  ProjectRecord,
  ProjectStatus,
  ProjectTaskAssignmentRecord,
  ProjectTaskRecord,
  ProjectWithDetails,
  ProjectWorkerView,
  UpdateProjectHourBagEntryInput,
  UpdateProjectInput,
  WorkPackageRecord,
  WorkPackageWithTasks,
} from "../domain/types";

// ── Row types ────────────────────────────────────────────────────────────────

interface DbProjectRow {
  id: string;
  code: string;
  name: string;
  client_name: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  total_budget_hours: string | number | null;
  hour_tracking_mode: HourTrackingMode;
  manager_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DbWorkPackageRow {
  id: string;
  project_id: string;
  name: string;
  budget_hours: string | number | null;
  start_date: string | null;
  end_date: string | null;
  position: number;
  created_at: string;
}

interface DbTaskRow {
  id: string;
  project_id: string;
  work_package_id: string | null;
  name: string;
  budget_hours: string | number | null;
  start_date: string | null;
  end_date: string | null;
  is_default: number;
  position: number;
  created_at: string;
}

interface DbAssignmentRow {
  id: string;
  project_id: string;
  user_id: string;
  assigned_by: string;
  created_at: string;
}

interface DbTaskAssignmentRow {
  id: string;
  project_id: string;
  task_id: string;
  user_id: string;
  assigned_by: string;
  created_at: string;
}

interface DbPartitionRow {
  id: string;
  project_id: string;
  name: string;
  budget_amount: string | number;
  created_at: string;
  updated_at: string;
}

interface DbHourBagEntryRow {
  id: string;
  project_id: string;
  assigned_user_id: string | null;
  company: string;
  purchase_order_number: string;
  external_project_name: string;
  task_name: string;
  building_block: string;
  specialization: string;
  area: string;
  resource_name: string;
  hours: string | number;
  date: string;
  review_status: HourBagReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

const mapProject = (row: DbProjectRow): ProjectRecord => ({
  id: row.id,
  code: row.code,
  name: row.name,
  clientName: row.client_name,
  status: row.status,
  startDate: row.start_date ? String(row.start_date).slice(0, 10) : null,
  endDate: row.end_date ? String(row.end_date).slice(0, 10) : null,
  totalBudgetHours: row.total_budget_hours == null ? null : Number(row.total_budget_hours),
  hourTrackingMode: row.hour_tracking_mode,
  managerId: row.manager_id,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapWorkPackage = (row: DbWorkPackageRow): WorkPackageRecord => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  budgetHours: row.budget_hours == null ? null : Number(row.budget_hours),
  startDate: row.start_date,
  endDate: row.end_date,
  position: row.position,
  createdAt: row.created_at,
});

const mapTask = (row: DbTaskRow): ProjectTaskRecord => ({
  id: row.id,
  projectId: row.project_id,
  workPackageId: row.work_package_id,
  name: row.name,
  budgetHours: row.budget_hours == null ? null : Number(row.budget_hours),
  startDate: row.start_date,
  endDate: row.end_date,
  isDefault: Boolean(row.is_default),
  position: row.position,
  createdAt: row.created_at,
});

const mapAssignment = (row: DbAssignmentRow): ProjectAssignmentRecord => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  assignedBy: row.assigned_by,
  createdAt: row.created_at,
});

const mapTaskAssignment = (row: DbTaskAssignmentRow): ProjectTaskAssignmentRecord => ({
  id: row.id,
  projectId: row.project_id,
  taskId: row.task_id,
  userId: row.user_id,
  assignedBy: row.assigned_by,
  createdAt: row.created_at,
});

const mapPartition = (row: DbPartitionRow): BudgetPartitionRecord => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  budgetAmount: Number(row.budget_amount),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapHourBagEntry = (row: DbHourBagEntryRow): ProjectHourBagEntryRecord => ({
  id: row.id,
  projectId: row.project_id,
  assignedUserId: row.assigned_user_id,
  company: row.company,
  purchaseOrderNumber: row.purchase_order_number,
  externalProjectName: row.external_project_name,
  taskName: row.task_name,
  buildingBlock: row.building_block,
  specialization: row.specialization,
  area: row.area,
  resourceName: row.resource_name,
  hours: row.hours == null ? null : Number(row.hours),
  date: row.date == null ? null : String(row.date).slice(0, 10),
  reviewStatus: row.review_status,
  reviewedBy: row.reviewed_by,
  reviewedAt: row.reviewed_at,
  rejectionReason: row.rejection_reason,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ── Repository ────────────────────────────────────────────────────────────────

class ProjectsRepository {
  private get pool() {
    return getMySqlPool();
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  async listAll(): Promise<ProjectRecord[]> {
    const [rows] = await this.pool.query<DbProjectRow[]>(
      "SELECT * FROM projects ORDER BY created_at DESC",
    );
    return rows.map(mapProject);
  }

  async listByManager(managerId: string): Promise<ProjectRecord[]> {
    const [rows] = await this.pool.query<DbProjectRow[]>(
      "SELECT * FROM projects WHERE manager_id = ? ORDER BY created_at DESC",
      [managerId],
    );
    return rows.map(mapProject);
  }

  async listByUser(userId: string): Promise<ProjectRecord[]> {
    const [rows] = await this.pool.query<DbProjectRow[]>(
      `SELECT p.* FROM projects p
       INNER JOIN project_assignments pa ON pa.project_id = p.id
       WHERE pa.user_id = ?
       ORDER BY p.start_date ASC`,
      [userId],
    );
    return rows.map(mapProject);
  }

  async getById(id: string): Promise<ProjectRecord | null> {
    const [rows] = await this.pool.query<DbProjectRow[]>(
      "SELECT * FROM projects WHERE id = ?",
      [id],
    );
    return rows[0] ? mapProject(rows[0]) : null;
  }

  async create(input: CreateProjectInput, createdBy: string): Promise<ProjectRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT INTO projects
         (id, code, name, client_name, status, start_date, end_date, total_budget_hours,
          hour_tracking_mode, manager_id, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.code.trim().toUpperCase(),
        input.name.trim(),
        input.clientName ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        input.totalBudgetHours ?? null,
        input.hourTrackingMode,
        input.managerId,
        createdBy,
        now,
        now,
      ],
    );
    return (await this.getById(id))!;
  }

  async update(id: string, input: UpdateProjectInput): Promise<ProjectRecord> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.code !== undefined) { fields.push("code = ?"); values.push(input.code.trim().toUpperCase()); }
    if (input.name !== undefined) { fields.push("name = ?"); values.push(input.name.trim()); }
    if ("clientName" in input) { fields.push("client_name = ?"); values.push(input.clientName ?? null); }
    if (input.status !== undefined) { fields.push("status = ?"); values.push(input.status); }
    if (input.startDate !== undefined) { fields.push("start_date = ?"); values.push(input.startDate); }
    if (input.endDate !== undefined) { fields.push("end_date = ?"); values.push(input.endDate); }
    if ("totalBudgetHours" in input) { fields.push("total_budget_hours = ?"); values.push(input.totalBudgetHours ?? null); }
    if (input.managerId !== undefined) { fields.push("manager_id = ?"); values.push(input.managerId); }

    fields.push("updated_at = ?");
    values.push(now);
    values.push(id);

    await this.pool.query(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`, values);
    return (await this.getById(id))!;
  }

  async deleteById(id: string): Promise<void> {
    await this.pool.query("DELETE FROM project_hour_bag_entries WHERE project_id = ?", [id]);
    await this.pool.query("DELETE FROM project_expenses WHERE project_id = ?", [id]);
    await this.pool.query("DELETE FROM project_time_entries WHERE project_id = ?", [id]);
    await this.pool.query("DELETE FROM projects WHERE id = ?", [id]);
  }

  // ── Work Packages ─────────────────────────────────────────────────────────

  async listWorkPackagesByProject(projectId: string): Promise<WorkPackageRecord[]> {
    const [rows] = await this.pool.query<DbWorkPackageRow[]>(
      "SELECT * FROM project_work_packages WHERE project_id = ? ORDER BY position ASC",
      [projectId],
    );
    return rows.map(mapWorkPackage);
  }

  async createWorkPackage(
    projectId: string,
    input: CreateWorkPackageInput,
    position: number,
  ): Promise<WorkPackageRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT INTO project_work_packages
         (id, project_id, name, budget_hours, start_date, end_date, position, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, input.name.trim(), input.budgetHours ?? null, input.startDate ?? null, input.endDate ?? null, position, now],
    );
    const [rows] = await this.pool.query<DbWorkPackageRow[]>(
      "SELECT * FROM project_work_packages WHERE id = ?",
      [id],
    );
    return mapWorkPackage(rows[0]);
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  async listTasksByProject(projectId: string): Promise<ProjectTaskRecord[]> {
    const [rows] = await this.pool.query<DbTaskRow[]>(
      `SELECT * FROM project_tasks WHERE project_id = ?
       ORDER BY work_package_id ASC, position ASC`,
      [projectId],
    );
    return rows.map(mapTask);
  }

  async getTaskById(id: string): Promise<ProjectTaskRecord | null> {
    const [rows] = await this.pool.query<DbTaskRow[]>(
      "SELECT * FROM project_tasks WHERE id = ?",
      [id],
    );
    return rows[0] ? mapTask(rows[0]) : null;
  }

  async createTask(
    projectId: string,
    workPackageId: string | null,
    name: string,
    budgetHours: number | null,
    startDate: string | null,
    endDate: string | null,
    isDefault: boolean,
    position: number,
  ): Promise<ProjectTaskRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT INTO project_tasks
         (id, project_id, work_package_id, name, budget_hours, start_date, end_date, is_default, position, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, workPackageId, name, budgetHours, startDate, endDate, isDefault ? 1 : 0, position, now],
    );
    return (await this.getTaskById(id))!;
  }

  // ── Project assignments ───────────────────────────────────────────────────

  async listAssignmentsByProject(projectId: string): Promise<ProjectAssignmentRecord[]> {
    const [rows] = await this.pool.query<DbAssignmentRow[]>(
      "SELECT * FROM project_assignments WHERE project_id = ?",
      [projectId],
    );
    return rows.map(mapAssignment);
  }

  async addProjectAssignment(projectId: string, userId: string, assignedBy: string): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT IGNORE INTO project_assignments (id, project_id, user_id, assigned_by, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, projectId, userId, assignedBy, now],
    );
  }

  async removeProjectAssignment(projectId: string, userId: string): Promise<void> {
    await this.pool.query(
      "DELETE FROM project_assignments WHERE project_id = ? AND user_id = ?",
      [projectId, userId],
    );
  }

  // ── Task assignments ──────────────────────────────────────────────────────

  async listTaskAssignmentsByProject(projectId: string): Promise<ProjectTaskAssignmentRecord[]> {
    const [rows] = await this.pool.query<DbTaskAssignmentRow[]>(
      "SELECT * FROM project_task_assignments WHERE project_id = ?",
      [projectId],
    );
    return rows.map(mapTaskAssignment);
  }

  async listTaskAssignmentsByUser(projectId: string, userId: string): Promise<ProjectTaskAssignmentRecord[]> {
    const [rows] = await this.pool.query<DbTaskAssignmentRow[]>(
      "SELECT * FROM project_task_assignments WHERE project_id = ? AND user_id = ?",
      [projectId, userId],
    );
    return rows.map(mapTaskAssignment);
  }

  async addTaskAssignment(projectId: string, taskId: string, userId: string, assignedBy: string): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT IGNORE INTO project_task_assignments
         (id, project_id, task_id, user_id, assigned_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, taskId, userId, assignedBy, now],
    );
  }

  async removeTaskAssignment(taskId: string, userId: string): Promise<void> {
    await this.pool.query(
      "DELETE FROM project_task_assignments WHERE task_id = ? AND user_id = ?",
      [taskId, userId],
    );
  }

  // ── Budget partitions ─────────────────────────────────────────────────────

  async listPartitionsByProject(projectId: string): Promise<BudgetPartitionRecord[]> {
    const [rows] = await this.pool.query<DbPartitionRow[]>(
      "SELECT * FROM project_budget_partitions WHERE project_id = ? ORDER BY created_at ASC",
      [projectId],
    );
    return rows.map(mapPartition);
  }

  async createPartition(projectId: string, name: string, budgetAmount: number): Promise<BudgetPartitionRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT INTO project_budget_partitions (id, project_id, name, budget_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, name.trim(), budgetAmount, now, now],
    );
    const [rows] = await this.pool.query<DbPartitionRow[]>(
      "SELECT * FROM project_budget_partitions WHERE id = ?",
      [id],
    );
    return mapPartition(rows[0]);
  }

  async getPartitionById(id: string): Promise<BudgetPartitionRecord | null> {
    const [rows] = await this.pool.query<DbPartitionRow[]>(
      "SELECT * FROM project_budget_partitions WHERE id = ?",
      [id],
    );
    return rows[0] ? mapPartition(rows[0]) : null;
  }

  // ── Hour bag entries ───────────────────────────────────────────────────────

  async listHourBagEntriesByProject(projectId: string): Promise<ProjectHourBagEntryRecord[]> {
    const [rows] = await this.pool.query<DbHourBagEntryRow[]>(
      `SELECT * FROM project_hour_bag_entries
       WHERE project_id = ?
       ORDER BY date DESC, created_at DESC`,
      [projectId],
    );
    return rows.map(mapHourBagEntry);
  }

  async getHourBagEntryById(id: string): Promise<ProjectHourBagEntryRecord | null> {
    const [rows] = await this.pool.query<DbHourBagEntryRow[]>(
      "SELECT * FROM project_hour_bag_entries WHERE id = ?",
      [id],
    );
    return rows[0] ? mapHourBagEntry(rows[0]) : null;
  }

  async createHourBagEntry(
    projectId: string,
    assignedUserId: string | null,
    input: CreateProjectHourBagEntryInput,
    createdBy: string,
  ): Promise<ProjectHourBagEntryRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT INTO project_hour_bag_entries
         (id, project_id, assigned_user_id, company, purchase_order_number, external_project_name, task_name,
           building_block, specialization, area, resource_name, hours, date, review_status, reviewed_by, reviewed_at,
           rejection_reason, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EMPTY', NULL, NULL, NULL, ?, NULL, ?, ?)`,
      [
        id,
        projectId,
        assignedUserId,
        input.company.trim(),
        input.purchaseOrderNumber.trim(),
        input.externalProjectName.trim(),
        input.taskName.trim(),
        input.buildingBlock.trim(),
        input.specialization.trim(),
        input.area.trim(),
        (input.resourceName ?? "").trim(),
        input.hours ?? null,
        input.date ?? null,
        createdBy,
        now,
        now,
      ],
    );
    return (await this.getHourBagEntryById(id))!;
  }

  async updateHourBagEntry(
    id: string,
    input: UpdateProjectHourBagEntryInput,
    updatedBy: string,
    options?: { reviewStatus?: HourBagReviewStatus; rejectionReason?: string | null; reviewedBy?: string | null; reviewedAt?: string | null },
  ): Promise<ProjectHourBagEntryRecord> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.company !== undefined) { fields.push("company = ?"); values.push(input.company.trim()); }
    if (input.purchaseOrderNumber !== undefined) { fields.push("purchase_order_number = ?"); values.push(input.purchaseOrderNumber.trim()); }
    if (input.externalProjectName !== undefined) { fields.push("external_project_name = ?"); values.push(input.externalProjectName.trim()); }
    if (input.taskName !== undefined) { fields.push("task_name = ?"); values.push(input.taskName.trim()); }
    if (input.buildingBlock !== undefined) { fields.push("building_block = ?"); values.push(input.buildingBlock.trim()); }
    if (input.specialization !== undefined) { fields.push("specialization = ?"); values.push(input.specialization.trim()); }
    if (input.area !== undefined) { fields.push("area = ?"); values.push(input.area.trim()); }
    if (input.resourceName !== undefined) { fields.push("resource_name = ?"); values.push(input.resourceName.trim()); }
    if (input.hours !== undefined) { fields.push("hours = ?"); values.push(input.hours); }
    if (input.date !== undefined) { fields.push("date = ?"); values.push(input.date); }
    if (options?.reviewStatus !== undefined) { fields.push("review_status = ?"); values.push(options.reviewStatus); }
    if (options && "reviewedBy" in options) { fields.push("reviewed_by = ?"); values.push(options.reviewedBy ?? null); }
    if (options && "reviewedAt" in options) { fields.push("reviewed_at = ?"); values.push(options.reviewedAt ?? null); }
    if (options && "rejectionReason" in options) { fields.push("rejection_reason = ?"); values.push(options.rejectionReason ?? null); }

    fields.push("updated_by = ?");
    values.push(updatedBy);
    fields.push("updated_at = ?");
    values.push(now);
    values.push(id);

    await this.pool.query(
      `UPDATE project_hour_bag_entries SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return (await this.getHourBagEntryById(id))!;
  }

  async deleteHourBagEntry(id: string): Promise<void> {
    await this.pool.query("DELETE FROM project_hour_bag_entries WHERE id = ?", [id]);
  }

  async listHourBagEntriesByProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectHourBagEntryRecord[]> {
    const [rows] = await this.pool.query<DbHourBagEntryRow[]>(
      `SELECT * FROM project_hour_bag_entries
       WHERE project_id = ? AND assigned_user_id = ?
       ORDER BY date DESC, created_at DESC`,
      [projectId, userId],
    );
    return rows.map(mapHourBagEntry);
  }

  async listPendingHourBagEntriesByManagedProjects(
    managerProjectIds: string[],
  ): Promise<ProjectHourBagEntryRecord[]> {
    if (managerProjectIds.length === 0) return [];
    const placeholders = managerProjectIds.map(() => "?").join(", ");
    const [rows] = await this.pool.query<DbHourBagEntryRow[]>(
      `SELECT * FROM project_hour_bag_entries
       WHERE project_id IN (${placeholders}) AND review_status = 'PENDING'
       ORDER BY updated_at ASC, created_at ASC`,
      managerProjectIds,
    );
    return rows.map(mapHourBagEntry);
  }

  // ── Composed views ────────────────────────────────────────────────────────

  async getProjectWithDetails(projectId: string, managerName: string): Promise<ProjectWithDetails | null> {
    const project = await this.getById(projectId);
    if (!project) return null;

    const workPackages = await this.listWorkPackagesByProject(projectId);
    const allTasks = await this.listTasksByProject(projectId);
    const assignments = await this.listAssignmentsByProject(projectId);
    const partitions = await this.listPartitionsByProject(projectId);
    const hourBagEntries = await this.listHourBagEntriesByProject(projectId);

    const wpMap = new Map<string, WorkPackageWithTasks>();
    for (const wp of workPackages) {
      wpMap.set(wp.id, { ...wp, tasks: [] });
    }

    const rootTasks: ProjectTaskRecord[] = [];
    for (const task of allTasks) {
      if (task.workPackageId && wpMap.has(task.workPackageId)) {
        wpMap.get(task.workPackageId)!.tasks.push(task);
      } else {
        rootTasks.push(task);
      }
    }

    const withRoot = [...wpMap.values()];
    if (rootTasks.length > 0) {
      withRoot.unshift({
        id: "root",
        projectId,
        name: "General",
        budgetHours: null,
        startDate: null,
        endDate: null,
        position: 0,
        createdAt: project.createdAt,
        tasks: rootTasks,
      });
    }

    return {
      ...project,
      managerName,
      workPackages: withRoot,
      assignedUserIds: assignments.map((a) => a.userId),
      budgetPartitions: partitions,
      hourBagEntries,
    };
  }

  async getProjectWorkerView(projectId: string, userId: string, managerName: string): Promise<ProjectWorkerView | null> {
    const project = await this.getById(projectId);
    if (!project) return null;

    const workPackages = await this.listWorkPackagesByProject(projectId);
    const allTasks = await this.listTasksByProject(projectId);
    const taskAssignments = await this.listTaskAssignmentsByUser(projectId, userId);
    const assignedTaskIds = new Set(taskAssignments.map((assignment) => assignment.taskId));
    const hourBagEntries = await this.listHourBagEntriesByProjectAndUser(projectId, userId);

    const wpMap = new Map<string, WorkPackageWithTasks>();
    for (const wp of workPackages) {
      wpMap.set(wp.id, { ...wp, tasks: [] });
    }

    const rootTasks: ProjectTaskRecord[] = [];
    for (const task of allTasks) {
      const includeTask =
        project.hourTrackingMode === "BUILDING_BLOCK"
          ? assignedTaskIds.has(task.id)
          : true;
      if (!includeTask) continue;

      if (task.workPackageId && wpMap.has(task.workPackageId)) {
        wpMap.get(task.workPackageId)!.tasks.push(task);
      } else {
        rootTasks.push(task);
      }
    }

    let workerPackages = [...wpMap.values()];
    if (project.hourTrackingMode === "BUILDING_BLOCK") {
      workerPackages = workerPackages.filter((wp) => wp.tasks.length > 0);
    } else if (rootTasks.length > 0) {
      workerPackages = [
        {
          id: "root",
          projectId,
          name: "General",
          budgetHours: null,
          startDate: null,
          endDate: null,
          position: 0,
          createdAt: project.createdAt,
          tasks: rootTasks,
        },
        ...workerPackages,
      ];
    }

    return {
      ...project,
      managerName,
      workPackages: workerPackages,
      assignedTaskIds: [...assignedTaskIds],
      hourBagEntries,
    };
  }
}

export const createProjectsRepository = () => new ProjectsRepository();

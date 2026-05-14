import { getMySqlPool } from "../../../core/db/mysql";
import type { ExpenseRecord, ExpenseStatus } from "../domain/types";

interface DbExpenseRow {
  id: string;
  partition_id: string;
  project_id: string;
  user_id: string;
  amount: string | number;
  description: string;
  receipt_url: string | null;
  status: ExpenseStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

const mapExpense = (row: DbExpenseRow): ExpenseRecord => ({
  id: row.id,
  partitionId: row.partition_id,
  projectId: row.project_id,
  userId: row.user_id,
  amount: Number(row.amount),
  description: row.description,
  receiptUrl: row.receipt_url,
  status: row.status,
  reviewedBy: row.reviewed_by,
  reviewedAt: row.reviewed_at,
  rejectionReason: row.rejection_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class ExpensesRepository {
  private get pool() {
    return getMySqlPool();
  }

  async listByProject(projectId: string): Promise<ExpenseRecord[]> {
    const [rows] = await this.pool.query<DbExpenseRow[]>(
      "SELECT * FROM project_expenses WHERE project_id = ? ORDER BY created_at DESC",
      [projectId],
    );
    return rows.map(mapExpense);
  }

  async listByUser(userId: string): Promise<ExpenseRecord[]> {
    const [rows] = await this.pool.query<DbExpenseRow[]>(
      "SELECT * FROM project_expenses WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
    return rows.map(mapExpense);
  }

  async listPendingByManagedProjects(managerProjectIds: string[]): Promise<ExpenseRecord[]> {
    if (managerProjectIds.length === 0) return [];
    const placeholders = managerProjectIds.map(() => "?").join(", ");
    const [rows] = await this.pool.query<DbExpenseRow[]>(
      `SELECT * FROM project_expenses
       WHERE project_id IN (${placeholders}) AND status = 'PENDING'
       ORDER BY created_at ASC`,
      managerProjectIds,
    );
    return rows.map(mapExpense);
  }

  async getById(id: string): Promise<ExpenseRecord | null> {
    const [rows] = await this.pool.query<DbExpenseRow[]>(
      "SELECT * FROM project_expenses WHERE id = ?",
      [id],
    );
    return rows[0] ? mapExpense(rows[0]) : null;
  }

  async create(
    partitionId: string,
    projectId: string,
    userId: string,
    amount: number,
    description: string,
    receiptUrl: string | null,
  ): Promise<ExpenseRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `INSERT INTO project_expenses
         (id, partition_id, project_id, user_id, amount, description, receipt_url,
          status, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, NULL, NULL, ?, ?)`,
      [id, partitionId, projectId, userId, amount, description.trim(), receiptUrl, now, now],
    );
    return (await this.getById(id))!;
  }

  async approve(id: string, reviewedBy: string): Promise<ExpenseRecord> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `UPDATE project_expenses
       SET status = 'APPROVED', reviewed_by = ?, reviewed_at = ?, updated_at = ?
       WHERE id = ?`,
      [reviewedBy, now, now, id],
    );
    return (await this.getById(id))!;
  }

  async reject(id: string, reviewedBy: string, reason: string): Promise<ExpenseRecord> {
    const now = new Date().toISOString().replace("T", " ").replace("Z", "");
    await this.pool.query(
      `UPDATE project_expenses
       SET status = 'REJECTED', reviewed_by = ?, reviewed_at = ?, rejection_reason = ?, updated_at = ?
       WHERE id = ?`,
      [reviewedBy, now, reason.trim(), now, id],
    );
    return (await this.getById(id))!;
  }

  async sumApprovedByPartition(partitionId: string): Promise<number> {
    const [rows] = await this.pool.query<[{ total: string | number }]>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM project_expenses
       WHERE partition_id = ? AND status = 'APPROVED'`,
      [partitionId],
    );
    return Number((rows as unknown as { total: string | number }[])[0]?.total ?? 0);
  }
}

export const createExpensesRepository = () => new ExpensesRepository();

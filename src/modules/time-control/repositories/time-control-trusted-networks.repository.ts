import { getMySqlPool } from "../../../core/db/mysql";
import type {
  CreateTimeControlTrustedNetworkInput,
  TimeControlTrustedNetwork,
  UpdateTimeControlTrustedNetworkInput,
} from "../domain/types";

export interface TimeControlTrustedNetworksRepository {
  listAll(): Promise<TimeControlTrustedNetwork[]>;
  listActive(): Promise<TimeControlTrustedNetwork[]>;
  findById(id: string): Promise<TimeControlTrustedNetwork | null>;
  create(
    input: CreateTimeControlTrustedNetworkInput,
  ): Promise<TimeControlTrustedNetwork>;
  update(
    input: UpdateTimeControlTrustedNetworkInput,
  ): Promise<TimeControlTrustedNetwork>;
  setActive(id: string, isActive: boolean, updatedAt: string): Promise<void>;
}

interface DbTrustedNetworkRow {
  id: string;
  name: string;
  network_value: string;
  network_type: TimeControlTrustedNetwork["networkType"];
  is_active: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: DbTrustedNetworkRow): TimeControlTrustedNetwork => ({
  id: row.id,
  name: row.name,
  networkValue: row.network_value,
  networkType: row.network_type,
  isActive: Boolean(row.is_active),
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class MySqlTimeControlTrustedNetworksRepository
  implements TimeControlTrustedNetworksRepository
{
  async listAll(): Promise<TimeControlTrustedNetwork[]> {
    const [rows] = await getMySqlPool().query<DbTrustedNetworkRow[]>(
      `SELECT id, name, network_value, network_type, is_active, description,
              created_at, updated_at
       FROM time_control_trusted_networks
       ORDER BY is_active DESC, name ASC, created_at DESC`,
    );

    return rows.map(mapRow);
  }

  async listActive(): Promise<TimeControlTrustedNetwork[]> {
    const [rows] = await getMySqlPool().query<DbTrustedNetworkRow[]>(
      `SELECT id, name, network_value, network_type, is_active, description,
              created_at, updated_at
       FROM time_control_trusted_networks
       WHERE is_active = 1
       ORDER BY name ASC, created_at DESC`,
    );

    return rows.map(mapRow);
  }

  async findById(id: string): Promise<TimeControlTrustedNetwork | null> {
    const [rows] = await getMySqlPool().query<DbTrustedNetworkRow[]>(
      `SELECT id, name, network_value, network_type, is_active, description,
              created_at, updated_at
       FROM time_control_trusted_networks
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(
    input: CreateTimeControlTrustedNetworkInput,
  ): Promise<TimeControlTrustedNetwork> {
    await getMySqlPool().query(
      `INSERT INTO time_control_trusted_networks (
        id, name, network_value, network_type, is_active, description,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.name,
        input.networkValue,
        input.networkType,
        input.isActive ? 1 : 0,
        input.description,
        input.createdAt,
        input.updatedAt,
      ],
    );

    const created = await this.findById(input.id);
    if (!created) {
      throw new Error("No se pudo crear la red confiable.");
    }

    return created;
  }

  async update(
    input: UpdateTimeControlTrustedNetworkInput,
  ): Promise<TimeControlTrustedNetwork> {
    const setClauses: string[] = ["updated_at = ?"];
    const values: unknown[] = [input.updatedAt];

    if (input.name !== undefined) {
      setClauses.push("name = ?");
      values.push(input.name);
    }

    if (input.networkValue !== undefined) {
      setClauses.push("network_value = ?");
      values.push(input.networkValue);
    }

    if (input.networkType !== undefined) {
      setClauses.push("network_type = ?");
      values.push(input.networkType);
    }

    if (input.isActive !== undefined) {
      setClauses.push("is_active = ?");
      values.push(input.isActive ? 1 : 0);
    }

    if (input.description !== undefined) {
      setClauses.push("description = ?");
      values.push(input.description);
    }

    values.push(input.id);

    await getMySqlPool().query(
      `UPDATE time_control_trusted_networks
       SET ${setClauses.join(", ")}
       WHERE id = ?`,
      values,
    );

    const updated = await this.findById(input.id);
    if (!updated) {
      throw new Error("No se pudo actualizar la red confiable.");
    }

    return updated;
  }

  async setActive(id: string, isActive: boolean, updatedAt: string): Promise<void> {
    await getMySqlPool().query(
      `UPDATE time_control_trusted_networks
       SET is_active = ?, updated_at = ?
       WHERE id = ?`,
      [isActive ? 1 : 0, updatedAt, id],
    );
  }
}

export const createTimeControlTrustedNetworksRepository =
  (): TimeControlTrustedNetworksRepository =>
    new MySqlTimeControlTrustedNetworksRepository();

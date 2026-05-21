import { getMySqlPool } from "../../../core/db/mysql";
import type {
  CreateTimeControlAllowedLocationInput,
  TimeControlAllowedLocation,
  UpdateTimeControlAllowedLocationInput,
} from "../domain/types";

export interface TimeControlAllowedLocationsRepository {
  listAll(): Promise<TimeControlAllowedLocation[]>;
  listActive(): Promise<TimeControlAllowedLocation[]>;
  findById(id: string): Promise<TimeControlAllowedLocation | null>;
  create(
    input: CreateTimeControlAllowedLocationInput,
  ): Promise<TimeControlAllowedLocation>;
  update(
    input: UpdateTimeControlAllowedLocationInput,
  ): Promise<TimeControlAllowedLocation>;
  setActive(id: string, isActive: boolean, updatedAt: string): Promise<void>;
}

interface DbAllowedLocationRow {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  radius_meters: number | string;
  is_active: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: DbAllowedLocationRow): TimeControlAllowedLocation => ({
  id: row.id,
  name: row.name,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  radiusMeters: Number(row.radius_meters),
  isActive: Boolean(row.is_active),
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

class MySqlTimeControlAllowedLocationsRepository
  implements TimeControlAllowedLocationsRepository
{
  async listAll(): Promise<TimeControlAllowedLocation[]> {
    const [rows] = await getMySqlPool().query<DbAllowedLocationRow[]>(
      `SELECT id, name, latitude, longitude, radius_meters, is_active,
              description, created_at, updated_at
       FROM time_control_allowed_locations
       ORDER BY is_active DESC, name ASC, created_at DESC`,
    );

    return rows.map(mapRow);
  }

  async listActive(): Promise<TimeControlAllowedLocation[]> {
    const [rows] = await getMySqlPool().query<DbAllowedLocationRow[]>(
      `SELECT id, name, latitude, longitude, radius_meters, is_active,
              description, created_at, updated_at
       FROM time_control_allowed_locations
       WHERE is_active = 1
       ORDER BY name ASC, created_at DESC`,
    );

    return rows.map(mapRow);
  }

  async findById(id: string): Promise<TimeControlAllowedLocation | null> {
    const [rows] = await getMySqlPool().query<DbAllowedLocationRow[]>(
      `SELECT id, name, latitude, longitude, radius_meters, is_active,
              description, created_at, updated_at
       FROM time_control_allowed_locations
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(
    input: CreateTimeControlAllowedLocationInput,
  ): Promise<TimeControlAllowedLocation> {
    await getMySqlPool().query(
      `INSERT INTO time_control_allowed_locations (
        id, name, latitude, longitude, radius_meters, is_active, description,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.name,
        input.latitude,
        input.longitude,
        input.radiusMeters,
        input.isActive ? 1 : 0,
        input.description,
        input.createdAt,
        input.updatedAt,
      ],
    );

    const created = await this.findById(input.id);
    if (!created) {
      throw new Error("No se pudo crear la ubicación permitida.");
    }

    return created;
  }

  async update(
    input: UpdateTimeControlAllowedLocationInput,
  ): Promise<TimeControlAllowedLocation> {
    const setClauses: string[] = ["updated_at = ?"];
    const values: unknown[] = [input.updatedAt];

    if (input.name !== undefined) {
      setClauses.push("name = ?");
      values.push(input.name);
    }

    if (input.latitude !== undefined) {
      setClauses.push("latitude = ?");
      values.push(input.latitude);
    }

    if (input.longitude !== undefined) {
      setClauses.push("longitude = ?");
      values.push(input.longitude);
    }

    if (input.radiusMeters !== undefined) {
      setClauses.push("radius_meters = ?");
      values.push(input.radiusMeters);
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
      `UPDATE time_control_allowed_locations
       SET ${setClauses.join(", ")}
       WHERE id = ?`,
      values,
    );

    const updated = await this.findById(input.id);
    if (!updated) {
      throw new Error("No se pudo actualizar la ubicación permitida.");
    }

    return updated;
  }

  async setActive(id: string, isActive: boolean, updatedAt: string): Promise<void> {
    await getMySqlPool().query(
      `UPDATE time_control_allowed_locations
       SET is_active = ?, updated_at = ?
       WHERE id = ?`,
      [isActive ? 1 : 0, updatedAt, id],
    );
  }
}

export const createTimeControlAllowedLocationsRepository =
  (): TimeControlAllowedLocationsRepository =>
    new MySqlTimeControlAllowedLocationsRepository();

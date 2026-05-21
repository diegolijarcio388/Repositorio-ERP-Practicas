import type { TimeControlAllowedLocation } from "../domain/types";
import {
  createTimeControlAllowedLocationsRepository,
  type TimeControlAllowedLocationsRepository,
} from "../repositories/time-control-allowed-locations.repository";

const DEFAULT_ALLOWED_LOCATIONS: ReadonlyArray<TimeControlAllowedLocation> = [
  {
    id: "default-sede-principal",
    name: "Sede principal",
    latitude: 38.0,
    longitude: -3.0,
    radiusMeters: 100,
    isActive: true,
    description: "Ubicación por defecto mientras no haya ubicaciones configuradas.",
    createdAt: "",
    updatedAt: "",
  },
] as const;

export class TimeControlAllowedLocationsService {
  constructor(
    private readonly repository: TimeControlAllowedLocationsRepository = createTimeControlAllowedLocationsRepository(),
  ) {}

  async listActive(): Promise<TimeControlAllowedLocation[]> {
    const persistedLocations = await this.repository.listActive();
    return persistedLocations.length > 0
      ? persistedLocations
      : Array.from(DEFAULT_ALLOWED_LOCATIONS);
  }
}

export const createTimeControlAllowedLocationsService =
  (): TimeControlAllowedLocationsService =>
    new TimeControlAllowedLocationsService();

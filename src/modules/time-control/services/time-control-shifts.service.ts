import type { TimeControlShift } from "../domain/types";
import {
  createTimeControlShiftsRepository,
  type TimeControlShiftsRepository,
} from "../repositories/time-control-shifts.repository";

export class TimeControlShiftsService {
  constructor(
    private readonly repository: TimeControlShiftsRepository = createTimeControlShiftsRepository(),
  ) {}

  async findAssignedShiftByUserId(
    userId: string,
  ): Promise<TimeControlShift | null> {
    const shift = await this.repository.findAssignedByUserId(userId);
    if (!shift || !shift.isActive || shift.segments.length === 0) {
      return null;
    }

    return shift;
  }

  async listActive(): Promise<TimeControlShift[]> {
    return this.repository.listActive();
  }
}

export const createTimeControlShiftsService =
  (): TimeControlShiftsService => new TimeControlShiftsService();

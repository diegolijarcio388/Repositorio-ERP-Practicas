export interface TimesheetAdapter {
  createVacationSuggestions(input: {
    userId: string;
    days: string[];
    hoursPerDay: number;
    sourceRequestId: string;
  }): Promise<void>;
}

class NoopTimesheetAdapter implements TimesheetAdapter {
  async createVacationSuggestions(): Promise<void> {
    // TODO: Integrar con modulo real de control de horas cuando exista API.
  }
}

export const createTimesheetAdapter = (): TimesheetAdapter =>
  new NoopTimesheetAdapter();

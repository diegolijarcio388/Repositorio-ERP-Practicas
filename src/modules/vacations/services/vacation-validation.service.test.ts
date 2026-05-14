import { describe, expect, it } from "vitest";
import { createVacationValidationService } from "./vacation-validation.service";
import { expandDateRangeToDays } from "./date-helpers";

describe("vacation-validation.service", () => {
  const service = createVacationValidationService({
    listBlocksByDepartment: async () => [
      {
        id: "b1",
        departmentId: "dep-1",
        days: null,
        startDate: "2026-06-10",
        endDate: "2026-06-12",
        reason: null,
        createdBy: "u1",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    listCalendarEvents: async () => [
      {
        id: "c1",
        title: "Festivo",
        description: null,
        type: "HOLIDAY",
        scope: "GLOBAL",
        departmentId: null,
        days: ["2026-08-15"],
        startDate: null,
        endDate: null,
        allDay: true,
        blocksSelection: true,
        createdBy: "admin",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    listRequestsByUser: async () => [
      {
        id: "r1",
        userId: "u1",
        departmentId: "dep-1",
        requestTitle: null,
        days: ["2026-09-01"],
        requestType: "FULL_DAY",
        hourRanges: [],
        hoursTotal: 0,
        usesHourBank: false,
        status: "APPROVED",
        approverId: "u2",
        approverComment: null,
        proposedDays: null,
        proposedHourRanges: null,
        proposedHoursTotal: null,
        changeRequestComment: null,
        changeOriginStatus: null,
        createdByAdmin: false,
        fixedByDepartment: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  });

  it("rechaza solicitud si incluye festivo HOLIDAY", async () => {
    await expect(
      service.validateVacationRequestDays("u1", "dep-1", ["2026-08-15"]),
    ).rejects.toThrow("bloqueados");
  });

  it("rechaza solapes por dia", async () => {
    await expect(
      service.validateVacationRequestDays("u1", "dep-1", ["2026-09-01"]),
    ).rejects.toThrow("solicitados");
  });

  it("expande rangos de bloqueos/eventos correctamente", async () => {
    expect(expandDateRangeToDays("2026-06-10", "2026-06-12")).toEqual([
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
    ]);
    const blocked = await service.buildBlockedDaysSet(
      "dep-1",
      "2026-06-01",
      "2026-08-31",
    );
    expect(blocked.has("2026-06-10")).toBe(true);
    expect(blocked.has("2026-06-11")).toBe(true);
    expect(blocked.has("2026-06-12")).toBe(true);
    expect(blocked.has("2026-08-15")).toBe(true);
  });
});

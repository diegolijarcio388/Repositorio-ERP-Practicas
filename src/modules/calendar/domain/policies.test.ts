import { describe, expect, it } from "vitest";
import { forceBlocksSelectionForHoliday } from "./policies";

describe("calendar policies", () => {
  it("HOLIDAY fuerza blocksSelection=true", () => {
    expect(forceBlocksSelectionForHoliday("HOLIDAY", false)).toBe(true);
    expect(forceBlocksSelectionForHoliday("HOLIDAY", true)).toBe(true);
  });
});

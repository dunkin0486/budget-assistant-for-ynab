import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lastNMonths } from "./date-utils.js";

describe("lastNMonths", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 8, 13))); // 2026-09-13
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns just the current month for n=1", () => {
    expect(lastNMonths(1)).toEqual(["2026-09-01"]);
  });

  it("returns n months, oldest first, ending with the current month", () => {
    expect(lastNMonths(3)).toEqual(["2026-07-01", "2026-08-01", "2026-09-01"]);
  });

  it("crosses a year boundary correctly", () => {
    vi.setSystemTime(new Date(Date.UTC(2026, 1, 1))); // 2026-02-01
    expect(lastNMonths(3)).toEqual(["2025-12-01", "2026-01-01", "2026-02-01"]);
  });
});

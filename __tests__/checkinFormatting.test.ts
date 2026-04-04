import { formatDuration, isManualCheckout } from "@/src/utils/checkinFormatting";

// Helper: build ISO strings offset from a base time
function iso(base: Date, offsetMs: number): string {
  return new Date(base.getTime() + offsetMs).toISOString();
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

describe("formatDuration", () => {
  const base = new Date("2025-01-01T12:00:00Z");

  it("formats sub-hour durations in minutes", () => {
    expect(formatDuration(base.toISOString(), iso(base, 30 * MIN))).toBe("30m");
    expect(formatDuration(base.toISOString(), iso(base, 1 * MIN))).toBe("1m");
    expect(formatDuration(base.toISOString(), iso(base, 59 * MIN))).toBe("59m");
  });

  it("formats exact hours with no minutes", () => {
    expect(formatDuration(base.toISOString(), iso(base, 1 * HOUR))).toBe("1h");
    expect(formatDuration(base.toISOString(), iso(base, 2 * HOUR))).toBe("2h");
    expect(formatDuration(base.toISOString(), iso(base, 3 * HOUR))).toBe("3h");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(base.toISOString(), iso(base, 1 * HOUR + 30 * MIN))).toBe("1h 30m");
    expect(formatDuration(base.toISOString(), iso(base, 2 * HOUR + 15 * MIN))).toBe("2h 15m");
    expect(formatDuration(base.toISOString(), iso(base, 2 * HOUR + 55 * MIN))).toBe("2h 55m");
  });

  it("rounds to nearest minute", () => {
    // 30.4 minutes → 30m, 30.5 minutes → 31m
    expect(formatDuration(base.toISOString(), iso(base, 30 * MIN + 24 * 1000))).toBe("30m");
    expect(formatDuration(base.toISOString(), iso(base, 30 * MIN + 30 * 1000))).toBe("31m");
  });
});

describe("isManualCheckout", () => {
  const createdAt = new Date("2025-01-01T12:00:00Z").toISOString();

  describe("active check-ins", () => {
    it("returns null for active check-ins regardless of times", () => {
      const expires = iso(new Date(createdAt), 1 * HOUR);
      expect(isManualCheckout(createdAt, expires, true)).toBeNull();
    });
  });

  describe("missing created_at", () => {
    it("returns null when created_at is null", () => {
      const expires = iso(new Date(createdAt), 1 * HOUR);
      expect(isManualCheckout(null, expires, false)).toBeNull();
    });

    it("returns null when created_at is undefined", () => {
      const expires = iso(new Date(createdAt), 1 * HOUR);
      expect(isManualCheckout(undefined, expires, false)).toBeNull();
    });
  });

  describe("manual checkout detection", () => {
    it("detects manual checkout when session is under 2h55m", () => {
      // 30 minutes — clearly manual
      const expires = iso(new Date(createdAt), 30 * MIN);
      expect(isManualCheckout(createdAt, expires, false)).toBe(true);
    });

    it("detects manual checkout at the threshold boundary (just under 2h55m)", () => {
      // 2h 54m 59s — just under threshold → manual
      const expires = iso(new Date(createdAt), 2 * HOUR + 54 * MIN + 59 * 1000);
      expect(isManualCheckout(createdAt, expires, false)).toBe(true);
    });

    it("detects auto checkout at exactly 3 hours", () => {
      const expires = iso(new Date(createdAt), 3 * HOUR);
      expect(isManualCheckout(createdAt, expires, false)).toBe(false);
    });

    it("detects auto checkout just above the 2h55m threshold", () => {
      // 2h 55m exactly → auto (equal to threshold, not less than)
      const expires = iso(new Date(createdAt), 2 * HOUR + 55 * MIN);
      expect(isManualCheckout(createdAt, expires, false)).toBe(false);
    });

    it("detects manual checkout for very short sessions", () => {
      const expires = iso(new Date(createdAt), 5 * MIN);
      expect(isManualCheckout(createdAt, expires, false)).toBe(true);
    });
  });
});

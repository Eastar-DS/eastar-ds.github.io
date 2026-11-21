import { describe, expect, it } from "vitest";

import formatDate from ".";

describe("formatDate", () => {
  const date = new Date("2026-11-08T00:00:00Z");

  it.each([
    ["long", "2026년 11월 8일"],
    ["dot", "2026.11.08"],
    ["monthDay", "11.08"],
    ["year", "2026"],
    ["iso", "2026-11-08"],
  ] as const)("%s 형식으로 바꾼다", (format, expected) => {
    expect(formatDate({ date, format })).toBe(expected);
  });

  it("UTC로 전날 밤이어도 한국 날짜로 바꾼다", () => {
    const lateNightUtc = new Date("2026-12-31T16:00:00Z");

    expect(formatDate({ date: lateNightUtc, format: "iso" })).toBe(
      "2027-01-01",
    );
  });
});

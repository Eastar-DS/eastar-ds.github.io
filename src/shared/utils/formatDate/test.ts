import { describe, expect, it } from "vitest";

import formatDate from ".";

describe("formatDate", () => {
  const date = new Date("2026-11-08T00:00:00Z");

  it.each([
    ["long", "2026년 11월 8일"],
    ["dot", "2026.11.08"],
    ["monthDay", "11.08"],
    ["monthDayLong", "11월 8일"],
    ["year", "2026"],
    ["iso", "2026-11-08"],
    ["isoDateTime", "2026-11-08T00:00:00+09:00"],
  ] as const)("%s 형식으로 바꾼다", (format, expected) => {
    expect(formatDate({ date, format })).toBe(expected);
  });

  it("UTC로 전날 밤이어도 한국 날짜로 바꾼다", () => {
    const lateNightUtc = new Date("2026-12-31T16:00:00Z");

    expect(formatDate({ date: lateNightUtc, format: "iso" })).toBe(
      "2027-01-01",
    );
  });

  it("isoDateTime은 시각을 버리고 한국 달력 날짜의 0시로 적는다", () => {
    const lateNightUtc = new Date("2026-12-31T16:05:09Z");

    expect(formatDate({ date: lateNightUtc, format: "isoDateTime" })).toBe(
      "2027-01-01T00:00:00+09:00",
    );
  });

  it("isoDateTime은 한국 자정을 24시가 아니라 00시로 적는다", () => {
    const kstMidnight = new Date("2026-11-07T15:00:00Z");

    expect(formatDate({ date: kstMidnight, format: "isoDateTime" })).toBe(
      "2026-11-08T00:00:00+09:00",
    );
  });
});

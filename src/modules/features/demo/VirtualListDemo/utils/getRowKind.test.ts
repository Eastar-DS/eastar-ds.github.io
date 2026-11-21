import { describe, expect, it } from "vitest";

import getRowKind from "./getRowKind";

const ranges = {
  visible: { start: 10, end: 16 },
  drawn: { start: 8, end: 18 },
};

describe("getRowKind", () => {
  it("보이는 구간의 행은 보이는 행이다", () => {
    expect(getRowKind({ index: 10, ranges, isVirtualized: true })).toBe(
      "visible",
    );
    expect(getRowKind({ index: 15, ranges, isVirtualized: true })).toBe(
      "visible",
    );
  });

  it("가상화를 켜면 보이는 구간 밖에서 그린 행은 미리 그린 행이다", () => {
    expect(getRowKind({ index: 8, ranges, isVirtualized: true })).toBe(
      "overscan",
    );
    expect(getRowKind({ index: 17, ranges, isVirtualized: true })).toBe(
      "overscan",
    );
  });

  it("가상화를 끄면 보이는 구간 밖에서 그린 행은 화면 밖에 그린 행이다", () => {
    expect(
      getRowKind({
        index: 0,
        ranges: { visible: ranges.visible, drawn: { start: 0, end: 2000 } },
        isVirtualized: false,
      }),
    ).toBe("offscreen");
  });

  it("그린 구간 밖의 행은 그리지 않은 행이다", () => {
    expect(getRowKind({ index: 7, ranges, isVirtualized: true })).toBe(
      "notDrawn",
    );
    expect(getRowKind({ index: 18, ranges, isVirtualized: true })).toBe(
      "notDrawn",
    );
  });
});

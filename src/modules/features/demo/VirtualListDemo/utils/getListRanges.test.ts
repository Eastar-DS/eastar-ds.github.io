import { describe, expect, it } from "vitest";

import getListRanges, { getRowRange } from "./getListRanges";

describe("getRowRange", () => {
  it("구간에 조금이라도 걸친 행을 고른다", () => {
    expect(
      getRowRange({ rowCount: 100, rowHeight: 40, rangeStart: 90, rangeEnd: 170 }),
    ).toEqual({ start: 2, end: 5 });
  });

  it("행 경계에 딱 닿기만 한 행은 고르지 않는다", () => {
    expect(
      getRowRange({ rowCount: 100, rowHeight: 40, rangeStart: 80, rangeEnd: 160 }),
    ).toEqual({ start: 2, end: 4 });
  });

  it("목록 맨 위보다 위와 맨 끝보다 아래는 목록 안으로 자른다", () => {
    expect(
      getRowRange({ rowCount: 10, rowHeight: 40, rangeStart: -120, rangeEnd: 1000 }),
    ).toEqual({ start: 0, end: 10 });
  });

  it("구간이 목록 밖에만 있으면 빈 구간을 돌려준다", () => {
    expect(
      getRowRange({ rowCount: 10, rowHeight: 40, rangeStart: 500, rangeEnd: 600 }),
    ).toEqual({ start: 10, end: 10 });
  });
});

describe("getListRanges", () => {
  const base = { rowCount: 2000, rowHeight: 40, viewportHeight: 240 };

  it("가상화를 켜면 화면 위아래로 미리 그릴 거리만큼 더 그린다", () => {
    expect(
      getListRanges({ ...base, scrollTop: 400, overscanPx: 80, isVirtualized: true }),
    ).toEqual({
      visible: { start: 10, end: 16 },
      drawn: { start: 8, end: 18 },
    });
  });

  it("맨 위에서는 위쪽 미리 그린 행 없이 아래쪽만 더 그린다", () => {
    expect(
      getListRanges({ ...base, scrollTop: 0, overscanPx: 80, isVirtualized: true }),
    ).toEqual({
      visible: { start: 0, end: 6 },
      drawn: { start: 0, end: 8 },
    });
  });

  it("미리 그릴 거리가 0이면 보이는 행만 그린다", () => {
    expect(
      getListRanges({ ...base, scrollTop: 420, overscanPx: 0, isVirtualized: true }),
    ).toEqual({
      visible: { start: 10, end: 17 },
      drawn: { start: 10, end: 17 },
    });
  });

  it("가상화를 끄면 모든 행을 그린다", () => {
    expect(
      getListRanges({ ...base, scrollTop: 400, overscanPx: 80, isVirtualized: false }),
    ).toEqual({
      visible: { start: 10, end: 16 },
      drawn: { start: 0, end: 2000 },
    });
  });
});

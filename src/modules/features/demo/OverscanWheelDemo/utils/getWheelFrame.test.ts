import { describe, expect, it } from "vitest";

import getRowOffsets from "./getRowOffsets";
import getVisibleRange from "./getVisibleRange";
import getWheelFrame from "./getWheelFrame";

// 요약 없는 행 994개(Knot의 가장 큰 폴더와 같은 문서 수). 1번 행부터 i번 행의 위쪽 끝은 65 × i − 1px입니다
const offsets = getRowOffsets({ rowCount: 994, rowHeight: 64, dividerPx: 1 });
const base = { offsets, viewStart: 3000, viewHeight: 750 };

describe("getRowOffsets", () => {
  it("두 번째 행부터 구분선 1px을 더해 쌓는다", () => {
    expect(getRowOffsets({ rowCount: 3, rowHeight: 64, dividerPx: 1 })).toEqual([
      0, 64, 129, 194,
    ]);
  });

  it("행이 없으면 카드 높이 0만 돌려준다", () => {
    expect(getRowOffsets({ rowCount: 0, rowHeight: 64, dividerPx: 1 })).toEqual([0]);
  });
});

describe("getVisibleRange", () => {
  const tenRows = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

  it("끝이 맞닿기만 한 행은 고르지 않는다", () => {
    expect(
      getVisibleRange({ offsets: tenRows, viewStart: 200, viewEnd: 400, overscanPx: 0 }),
    ).toEqual({ start: 2, end: 4 });
  });

  it("화면 밖에 있어도 넓힌 구간에 걸친 행은 고른다", () => {
    expect(
      getVisibleRange({ offsets: tenRows, viewStart: -400, viewEnd: -50, overscanPx: 100 }),
    ).toEqual({ start: 0, end: 1 });
  });

  it("넓힌 구간에 걸친 행이 없으면 빈 범위를 돌려준다", () => {
    expect(
      getVisibleRange({ offsets: tenRows, viewStart: 2000, viewEnd: 2500, overscanPx: 100 }),
    ).toEqual({ start: 0, end: 0 });
  });
});

describe("getWheelFrame", () => {
  it("미리 그릴 거리 160px에서 휠 300px이면 화면 아래쪽 86px이 빈다", () => {
    expect(getWheelFrame({ ...base, overscanPx: 160, wheelPx: 300 })).toEqual({
      range: { start: 43, end: 61 },
      drawn: { start: 2794, end: 3964 },
      widened: { start: 2840, end: 3910 },
      view: { start: 3000, end: 3750 },
      nextView: { start: 3300, end: 4050 },
      coveredBelowPx: 214,
      blank: { start: 3964, end: 4050 },
    });
  });

  it("미리 그릴 거리 325px이면 휠 300px에도 빈 칸이 없다", () => {
    const frame = getWheelFrame({ ...base, overscanPx: 325, wheelPx: 300 });

    expect(frame.range).toEqual({ start: 41, end: 63 });
    expect(frame.coveredBelowPx).toBe(344);
    expect(frame.blank).toBeNull();
  });

  it("휠 한 번이 그려 둔 거리보다 길면 그 차이만큼 빈다", () => {
    expect(getWheelFrame({ ...base, overscanPx: 325, wheelPx: 420 }).blank).toEqual({
      start: 4094,
      end: 4170,
    });
  });

  it("휠 뒤 화면 아래쪽 끝이 그린 행의 끝과 맞닿으면 빈 칸이 없다", () => {
    expect(getWheelFrame({ ...base, overscanPx: 325, wheelPx: 344 }).blank).toBeNull();
  });
});

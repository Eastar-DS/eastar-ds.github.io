import { describe, expect, it } from "vitest";

import getDrawnRowRange from "./getDrawnRowRange";

describe("getDrawnRowRange", () => {
  it("글의 예시(150–290px)에서는 2번째와 3번째 행을 고른다", () => {
    expect(getDrawnRowRange({ rowCount: 4, rowHeightPx: 100, rangeStartPx: 150, rangeEndPx: 290 })).toEqual({
      start: 1,
      end: 3,
    });
  });

  it("행 경계에 딱 닿기만 한 행은 고르지 않는다", () => {
    expect(getDrawnRowRange({ rowCount: 4, rowHeightPx: 100, rangeStartPx: 100, rangeEndPx: 300 })).toEqual({
      start: 1,
      end: 3,
    });
  });

  it("카드 위아래 밖으로 나간 범위는 카드 안으로 자른다", () => {
    expect(getDrawnRowRange({ rowCount: 4, rowHeightPx: 100, rangeStartPx: -20, rangeEndPx: 900 })).toEqual({
      start: 0,
      end: 4,
    });
  });

  it("범위가 카드 아래에만 있으면 빈 구간을 돌려준다", () => {
    expect(getDrawnRowRange({ rowCount: 4, rowHeightPx: 100, rangeStartPx: 500, rangeEndPx: 600 })).toEqual({
      start: 4,
      end: 4,
    });
  });
});

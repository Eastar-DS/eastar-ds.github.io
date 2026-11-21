import { describe, expect, it } from "vitest";

import getRowCounts from "./getRowCounts";

describe("getRowCounts", () => {
  it("그린 행, 보이는 행, 위아래 미리 그린 행, 그리지 않은 행을 센다", () => {
    expect(
      getRowCounts({
        rowCount: 2000,
        ranges: {
          visible: { start: 10, end: 16 },
          drawn: { start: 8, end: 18 },
        },
      }),
    ).toEqual({ drawn: 10, visible: 6, above: 2, below: 2, notDrawn: 1990 });
  });

  it("맨 위에서는 위쪽 미리 그린 행이 없다", () => {
    expect(
      getRowCounts({
        rowCount: 2000,
        ranges: { visible: { start: 0, end: 6 }, drawn: { start: 0, end: 8 } },
      }),
    ).toEqual({ drawn: 8, visible: 6, above: 0, below: 2, notDrawn: 1992 });
  });

  it("모두 그리면 그리지 않은 행이 없다", () => {
    expect(
      getRowCounts({
        rowCount: 2000,
        ranges: {
          visible: { start: 10, end: 16 },
          drawn: { start: 0, end: 2000 },
        },
      }),
    ).toEqual({ drawn: 2000, visible: 6, above: 10, below: 1984, notDrawn: 0 });
  });
});

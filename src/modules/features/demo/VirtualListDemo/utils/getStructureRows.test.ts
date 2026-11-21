import { describe, expect, it } from "vitest";

import getStructureRows from "./getStructureRows";

const base = {
  rowCount: 2000,
  rowHeight: 40,
  viewportHeight: 240,
  scale: 3,
  isVirtualized: true,
};

describe("getStructureRows", () => {
  it("화면을 가운데에 두고 위아래로 화면 높이만큼 더 줄여 담는다", () => {
    const { rows, rowHeight, viewTop, viewHeight } = getStructureRows({
      ...base,
      scrollTop: 400,
      ranges: { visible: { start: 10, end: 16 }, drawn: { start: 8, end: 18 } },
    });

    expect(rows.map((row) => row.index)).toEqual([
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ]);
    expect(rows[0].top).toBeCloseTo(0);
    expect(rowHeight).toBeCloseTo(40 / 3);
    expect(viewTop).toBe(80);
    expect(viewHeight).toBe(80);
  });

  it("행마다 보이는 행, 여유 행, 그리지 않은 행을 알려 준다", () => {
    const { rows } = getStructureRows({
      ...base,
      scrollTop: 400,
      ranges: { visible: { start: 10, end: 16 }, drawn: { start: 8, end: 18 } },
    });
    const kindOf = (index: number) =>
      rows.find((row) => row.index === index)?.kind;

    expect(kindOf(7)).toBe("notDrawn");
    expect(kindOf(8)).toBe("overscan");
    expect(kindOf(12)).toBe("visible");
    expect(kindOf(17)).toBe("overscan");
    expect(kindOf(18)).toBe("notDrawn");
  });

  it("맨 위에서는 목록 맨 위보다 위에 행을 만들지 않는다", () => {
    const { rows, viewTop } = getStructureRows({
      ...base,
      scrollTop: 0,
      ranges: { visible: { start: 0, end: 6 }, drawn: { start: 0, end: 8 } },
    });

    expect(rows[0].index).toBe(0);
    expect(rows[0].top).toBeCloseTo(80);
    expect(viewTop).toBe(80);
  });
});

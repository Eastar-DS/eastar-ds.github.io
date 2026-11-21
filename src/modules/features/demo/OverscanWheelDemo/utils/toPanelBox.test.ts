import { describe, expect, it } from "vitest";

import toPanelBox from "./toPanelBox";

const window = { start: 2500, end: 4500 };

describe("toPanelBox", () => {
  it("카드 좌표를 그림 높이에 맞춰 줄인다", () => {
    expect(toPanelBox({ span: { start: 3000, end: 3750 }, window, heightPx: 280 })).toEqual({
      top: 70,
      height: 105,
    });
  });

  it("그림 위로 나간 부분은 잘라 낸다", () => {
    expect(toPanelBox({ span: { start: 2000, end: 3000 }, window, heightPx: 280 })).toEqual({
      top: 0,
      height: 70,
    });
  });

  it("그림 밖에만 있는 구간은 그리지 않는다", () => {
    expect(toPanelBox({ span: { start: 4600, end: 4700 }, window, heightPx: 280 })).toBeNull();
  });
});

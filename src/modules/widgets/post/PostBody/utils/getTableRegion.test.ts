import { describe, expect, it } from "vitest";

import getTableRegion from "./getTableRegion";

describe("getTableRegion", () => {
  it("표가 넘치지 않으면 이름 있는 칸으로 만들지 않는다", () => {
    expect(getTableRegion({ scrollWidth: 680, clientWidth: 680, headers: ["방법"] })).toBeUndefined();
  });

  it("반올림 차이인 1px은 넘친 것으로 보지 않는다", () => {
    expect(getTableRegion({ scrollWidth: 681, clientWidth: 680, headers: [] })).toBeUndefined();
  });

  it("넘치고 표 설명이 있으면 설명의 id로 이름을 잇는다", () => {
    expect(
      getTableRegion({ scrollWidth: 900, clientWidth: 350, captionId: "content-table-caption-1", headers: ["방법"] }),
    ).toEqual({ labelledBy: "content-table-caption-1" });
  });

  it("넘치고 표 설명이 없으면 앞의 머리 칸 세 개로 이름을 짓는다", () => {
    expect(
      getTableRegion({ scrollWidth: 900, clientWidth: 350, headers: [" 방법 ", "좋은 점", "", "걸린 점", "비고"] }),
    ).toEqual({ label: "표: 방법, 좋은 점, 걸린 점" });
  });

  it("머리 칸도 없으면 「표」로 부른다", () => {
    expect(getTableRegion({ scrollWidth: 900, clientWidth: 350, headers: [] })).toEqual({ label: "표" });
  });
});

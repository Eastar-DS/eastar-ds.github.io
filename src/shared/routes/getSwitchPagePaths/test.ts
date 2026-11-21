import { describe, expect, it } from "vitest";

import getSwitchPagePaths from ".";

describe("getSwitchPagePaths", () => {
  it("켜져 있으면 나머지 매개변수가 빈 주소 하나를 만든다", () => {
    expect(getSwitchPagePaths(true)).toEqual([{ params: { path: undefined } }]);
  });

  it("꺼져 있으면 아무 주소도 만들지 않는다", () => {
    expect(getSwitchPagePaths(false)).toEqual([]);
  });
});

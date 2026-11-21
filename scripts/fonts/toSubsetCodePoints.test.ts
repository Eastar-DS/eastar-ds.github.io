import { describe, expect, it } from "vitest";

import toSubsetCodePoints from "./toSubsetCodePoints";

describe("toSubsetCodePoints", () => {
  it("글자를 코드 포인트로 바꾼다", () => {
    expect(toSubsetCodePoints(["가", "나"])).toEqual([0xac00, 0xb098]);
  });

  it("넣을 글자가 없으면 글꼴 전체가 남지 않게 공백 하나만 넣는다", () => {
    expect(toSubsetCodePoints([])).toEqual([0x20]);
  });
});

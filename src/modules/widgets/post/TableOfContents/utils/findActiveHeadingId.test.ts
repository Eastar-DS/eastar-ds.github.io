import { describe, expect, it } from "vitest";

import findActiveHeadingId from "./findActiveHeadingId";

const headingTops = [
  { id: "a", top: -400 },
  { id: "b", top: 80 },
  { id: "c", top: 600 },
];

describe("findActiveHeadingId", () => {
  it("기준선을 지난 제목 중 마지막 것을 고른다", () => {
    expect(
      findActiveHeadingId({ headingTops, offset: 120, isAtBottom: false }),
    ).toBe("b");
  });

  it("첫 제목에 닿기 전이면 고르지 않는다", () => {
    expect(
      findActiveHeadingId({
        headingTops: [{ id: "a", top: 300 }],
        offset: 120,
        isAtBottom: false,
      }),
    ).toBeUndefined();
  });

  it("글 끝까지 내리면 마지막 제목을 고른다", () => {
    expect(
      findActiveHeadingId({ headingTops, offset: 120, isAtBottom: true }),
    ).toBe("c");
  });
});

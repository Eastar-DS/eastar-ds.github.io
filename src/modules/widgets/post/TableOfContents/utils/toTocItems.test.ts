import { describe, expect, it } from "vitest";

import toTocItems from "./toTocItems";

describe("toTocItems", () => {
  it("h2와 h3만 목차에 넣는다", () => {
    const headings = [
      { depth: 2, slug: "a", text: "가" },
      { depth: 3, slug: "b", text: "나" },
      { depth: 4, slug: "c", text: "다" },
      { depth: 1, slug: "d", text: "라" },
    ];

    expect(toTocItems(headings)).toEqual([
      { id: "a", text: "가", depth: 2 },
      { id: "b", text: "나", depth: 3 },
    ]);
  });
});

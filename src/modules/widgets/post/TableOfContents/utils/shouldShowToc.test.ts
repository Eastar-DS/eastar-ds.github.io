import { describe, expect, it } from "vitest";

import shouldShowToc from "./shouldShowToc";

const h2 = (id: string) => ({ id, text: id, depth: 2 as const });
const h3 = (id: string) => ({ id, text: id, depth: 3 as const });

describe("shouldShowToc", () => {
  it("h2가 셋 이상이면 목차를 둔다", () => {
    expect(shouldShowToc([h2("a"), h2("b"), h2("c")])).toBe(true);
  });

  it("h3는 세지 않는다", () => {
    expect(shouldShowToc([h2("a"), h2("b"), h3("c"), h3("d")])).toBe(false);
  });
});

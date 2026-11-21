import { describe, expect, it } from "vitest";

import { parseCodeTitle } from ".";

describe("parseCodeTitle", () => {
  it.each([
    ['title="resize.ts"', "resize.ts"],
    ["title='resize.ts'", "resize.ts"],
    ["title=resize.ts {1-2}", "resize.ts"],
    ['{1} title="src/a b.ts"', "src/a b.ts"],
  ])("%s 에서 파일 이름을 읽는다", (meta, expected) => {
    expect(parseCodeTitle(meta)).toBe(expected);
  });

  it("title이 없으면 undefined를 돌려준다", () => {
    expect(parseCodeTitle("{1-2}")).toBeUndefined();
    expect(parseCodeTitle(undefined)).toBeUndefined();
  });
});

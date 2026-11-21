import { describe, expect, it } from "vitest";

import calculateReadingMinutes from ".";

describe("calculateReadingMinutes", () => {
  it("공백을 뺀 글자 500자를 1분으로 센다", () => {
    expect(calculateReadingMinutes("가".repeat(1500))).toBe(3);
  });

  it("짧은 글도 1분으로 센다", () => {
    expect(calculateReadingMinutes("짧은 글")).toBe(1);
  });

  it("MDX import 줄, 태그, 링크 주소는 세지 않는다", () => {
    const body = [
      'import Demo from "@/modules/features/demo/Demo";',
      "<Demo client:visible />",
      `[링크](https://example.com/${"a".repeat(600)})`,
    ].join("\n");

    expect(calculateReadingMinutes(body)).toBe(1);
  });
});

import { describe, expect, it } from "vitest";

import toPlainText from "./toPlainText";

describe("toPlainText", () => {
  it("태그를 지우고 글자만 남긴다", () => {
    expect(toPlainText("<code>transform</code>만 바꾸기")).toBe(
      "transform만 바꾸기",
    );
  });

  it("HTML 문자 참조를 글자로 돌리고 공백을 하나로 줄인다", () => {
    expect(toPlainText("  A &amp; B\n  &lt;div&gt; ")).toBe("A & B <div>");
  });
});

import { describe, expect, it } from "vitest";

import getPrintUrl from "./getPrintUrl";

describe("getPrintUrl", () => {
  it("바깥 링크는 https://와 끝의 /를 뗀 주소를 돌려준다", () => {
    expect(getPrintUrl("https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility")).toBe(
      "developer.mozilla.org/en-US/docs/Web/CSS/content-visibility",
    );
    expect(getPrintUrl("https://tanstack.com/virtual/latest/")).toBe("tanstack.com/virtual/latest");
  });

  it("사이트 안 링크와 각주 링크, 메일 링크에는 주소를 붙이지 않는다", () => {
    expect(getPrintUrl("/posts/virtual-list-row-range/")).toBeUndefined();
    expect(getPrintUrl("#user-content-fn-1")).toBeUndefined();
    expect(getPrintUrl("mailto:hello@example.com")).toBeUndefined();
    expect(getPrintUrl(undefined)).toBeUndefined();
  });
});

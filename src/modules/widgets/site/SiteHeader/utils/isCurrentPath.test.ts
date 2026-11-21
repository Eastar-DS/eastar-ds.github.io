import { describe, expect, it } from "vitest";

import isCurrentPath from "./isCurrentPath";

describe("isCurrentPath", () => {
  it("주소가 같으면 지금 페이지로 본다", () => {
    expect(isCurrentPath({ pathname: "/", href: "/" })).toBe(true);
    expect(isCurrentPath({ pathname: "/about", href: "/about/" })).toBe(true);
  });

  it("글 화면에서는 글 목록 메뉴를 지금 페이지로 보지 않는다", () => {
    expect(isCurrentPath({ pathname: "/posts/a/", href: "/" })).toBe(false);
  });

  it("페이지 안의 자리(#)를 가리키는 링크는 지금 페이지로 보지 않는다", () => {
    expect(isCurrentPath({ pathname: "/", href: "/#series" })).toBe(false);
  });
});

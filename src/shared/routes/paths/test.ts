import { describe, expect, it } from "vitest";

import { getPostPath, NAV_ITEMS } from ".";

describe("getPostPath", () => {
  it("글 주소를 /posts/글-이름/ 으로 만든다", () => {
    expect(getPostPath("browser-layout-and-paint")).toBe(
      "/posts/browser-layout-and-paint/",
    );
  });
});

describe("NAV_ITEMS", () => {
  it("시리즈 메뉴는 글 목록의 시리즈 구획으로 간다", () => {
    expect(NAV_ITEMS.find((item) => item.label === "시리즈")?.href).toBe(
      "/#series",
    );
  });
});

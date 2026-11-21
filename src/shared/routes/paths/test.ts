import { describe, expect, it } from "vitest";

import { getNavItems, getPostPath, NAV_ITEMS } from ".";

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

describe("getNavItems", () => {
  it("이력서 · 포트폴리오를 그리지 않으면 글 · 시리즈 · 소개만 둔다", () => {
    expect(
      getNavItems({ isResumeShown: false }).map((item) => item.label),
    ).toEqual(["글", "시리즈", "소개"]);
  });

  it("이력서 · 포트폴리오를 그리면 소개 뒤에 두 메뉴를 붙인다", () => {
    expect(getNavItems({ isResumeShown: true })).toEqual([
      { label: "글", href: "/" },
      { label: "시리즈", href: "/#series" },
      { label: "소개", href: "/about/" },
      { label: "이력서", href: "/resume/" },
      { label: "포트폴리오", href: "/portfolio/" },
    ]);
  });
});

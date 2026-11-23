import { describe, expect, it } from "vitest";

import {
  getNavItems,
  getOgImagePath,
  getPortfolioProjectPath,
  getPostPath,
  getSeriesPath,
  NAV_ITEMS,
} from ".";

describe("getPostPath", () => {
  it("글 주소를 /posts/글-이름/ 으로 만든다", () => {
    expect(getPostPath("virtualized-document-list")).toBe(
      "/posts/virtualized-document-list/",
    );
  });
});

describe("getOgImagePath", () => {
  it("공유 미리보기 그림을 페이지 주소 바로 아래 og.png에 둔다", () => {
    expect(getOgImagePath("/posts/virtualized-document-list/")).toBe(
      "/posts/virtualized-document-list/og.png",
    );
    expect(getOgImagePath("/resume/")).toBe("/resume/og.png");
  });

  it("첫 화면의 그림은 사이트 기본 그림(/og.png)이다", () => {
    expect(getOgImagePath("/")).toBe("/og.png");
  });
});

describe("getPortfolioProjectPath", () => {
  it("포트폴리오 페이지의 프로젝트 구획 주소를 만든다", () => {
    expect(getPortfolioProjectPath("knot")).toBe("/portfolio/#knot");
  });
});

describe("NAV_ITEMS", () => {
  it("시리즈 메뉴는 시리즈 목록으로 간다", () => {
    expect(NAV_ITEMS.find((item) => item.label === "시리즈")?.href).toBe(
      "/series/",
    );
  });
});

describe("getNavItems", () => {
  it("포트폴리오만 있으면 글 · 시리즈 · 소개 · 포트폴리오를 둔다", () => {
    expect(
      getNavItems({ isResumeShown: false, isPortfolioShown: true }).map(
        (item) => item.label,
      ),
    ).toEqual(["글", "시리즈", "소개", "포트폴리오"]);
  });

  it("이력서도 그리면 포트폴리오 뒤에 이력서를 붙인다", () => {
    expect(getNavItems({ isResumeShown: true, isPortfolioShown: true })).toEqual(
      [
        { label: "글", href: "/" },
        { label: "시리즈", href: "/series/" },
        { label: "소개", href: "/about/" },
        { label: "포트폴리오", href: "/portfolio/" },
        { label: "이력서", href: "/resume/" },
      ],
    );
  });

  it("포트폴리오 페이지가 없으면 포트폴리오 메뉴를 넣지 않는다", () => {
    expect(
      getNavItems({ isResumeShown: false, isPortfolioShown: false }).map(
        (item) => item.label,
      ),
    ).toEqual(["글", "시리즈", "소개"]);
  });
});

it("시리즈 id로 시리즈 페이지 주소를 만든다", () => {
  expect(getSeriesPath("virtual-list")).toBe("/series/virtual-list/");
});

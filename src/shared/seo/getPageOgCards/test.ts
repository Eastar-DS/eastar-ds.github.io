import { describe, expect, it } from "vitest";

import getPageOgCards from ".";

describe("getPageOgCards", () => {
  it("첫 화면의 사이트 기본 그림을 맨 앞에 둔다", () => {
    const [first] = getPageOgCards({ isResumeShown: false, isPortfolioShown: false });

    expect(first).toEqual({
      path: "/",
      alt: "이스타의 개발 노트",
      card: {
        title: "이스타의 개발 노트",
        description: expect.stringContaining("공부하며"),
      },
    });
  });

  it("이력서와 포트폴리오는 페이지가 있을 때만 그림을 둔다", () => {
    expect(
      getPageOgCards({ isResumeShown: false, isPortfolioShown: false }).map((item) => item.path),
    ).toEqual(["/"]);
    expect(
      getPageOgCards({ isResumeShown: false, isPortfolioShown: true }).map((item) => item.path),
    ).toEqual(["/", "/portfolio/"]);
    expect(
      getPageOgCards({ isResumeShown: true, isPortfolioShown: true }).map((item) => item.path),
    ).toEqual(["/", "/resume/", "/portfolio/"]);
  });

  it("이력서와 포트폴리오 그림에는 닉네임과 본명을 함께 쓴 이름을 SITE 상수에서 읽어 넣는다", () => {
    const cards = getPageOgCards({ isResumeShown: true, isPortfolioShown: true });

    expect(cards.find((item) => item.path === "/resume/")).toEqual({
      path: "/resume/",
      alt: "이스타(김동성)의 이력서",
      card: { label: "이스타(김동성)", title: "이력서" },
    });
    expect(cards.find((item) => item.path === "/portfolio/")).toEqual({
      path: "/portfolio/",
      alt: "이스타(김동성)의 포트폴리오",
      card: { label: "이스타(김동성)", title: "포트폴리오" },
    });
  });
});

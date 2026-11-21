import { describe, expect, it } from "vitest";

import getPageOgCards from "@/shared/seo/getPageOgCards";

import getOgImage from ".";

const pageCards = getPageOgCards({ isResumeShown: true, isPortfolioShown: true });

describe("getOgImage", () => {
  it("글은 글 주소 아래의 그림을 쓰고, 그림 설명은 글 제목이다", () => {
    expect(
      getOgImage({
        path: "/posts/virtualized-document-list/",
        title: "라이브러리 없이 목록 가상화하기",
        ogType: "article",
        pageCards,
      }),
    ).toEqual({
      url: "https://eastar-ds.github.io/posts/virtualized-document-list/og.png",
      alt: "라이브러리 없이 목록 가상화하기",
      width: 1200,
      height: 630,
      type: "image/png",
    });
  });

  it("자기 그림이 있는 페이지는 그 그림을 쓴다", () => {
    expect(getOgImage({ path: "/resume/", title: "이력서", ogType: "website", pageCards })).toMatchObject({
      url: "https://eastar-ds.github.io/resume/og.png",
      alt: "이스타(김동성)의 이력서",
    });
  });

  it("자기 그림이 없는 페이지는 사이트 기본 그림을 쓴다", () => {
    expect(getOgImage({ path: "/about/", title: "소개", ogType: "website", pageCards })).toMatchObject({
      url: "https://eastar-ds.github.io/og.png",
      alt: "이스타의 개발 노트",
    });
  });

  it("공개되지 않아 목록에 없는 페이지도 사이트 기본 그림을 쓴다", () => {
    expect(
      getOgImage({
        path: "/resume/",
        title: "이력서",
        ogType: "website",
        pageCards: getPageOgCards({ isResumeShown: false, isPortfolioShown: false }),
      }).url,
    ).toBe("https://eastar-ds.github.io/og.png");
  });
});

import { describe, expect, it } from "vitest";

import type { Post } from "@/shared/types/post";

import createLlmsTxt from ".";

const createPost = (overrides: Partial<Post>): Post => ({
  slug: "virtualized-document-list",
  title: "라이브러리 없이 목록 가상화하기: 966ms를 46ms로",
  description: "문서 1,939개를 다 그리던 목록을 화면 근처 행만 그리게 바꿨습니다.",
  category: "React",
  publishedAt: new Date("2026-11-21T00:00:00+09:00"),
  updatedAt: new Date("2026-11-21T00:00:00+09:00"),
  readingMinutes: 9,
  ...overrides,
});

describe("createLlmsTxt", () => {
  const llms = createLlmsTxt({ posts: [createPost({})], isResumeShown: false, isPortfolioShown: false });

  it("H1 사이트 이름, 인용문 사이트 설명 순서로 시작한다", () => {
    expect(llms.startsWith("# 이스타의 개발 노트\n\n> 도메인에 진심으로")).toBe(true);
  });

  it("글마다 제목, 절대 주소, 요약, 분류, 쓴 날을 링크 목록으로 적는다", () => {
    expect(llms).toContain(
      "## 글\n\n- [라이브러리 없이 목록 가상화하기: 966ms를 46ms로](https://eastar-ds.github.io/posts/virtualized-document-list/): 문서 1,939개를 다 그리던 목록을 화면 근처 행만 그리게 바꿨습니다. (분류 React, 2026년 11월 21일 씀)",
    );
  });

  it("고친 날이 쓴 날과 다르면 고친 날도 적는다", () => {
    const updated = createLlmsTxt({
      posts: [createPost({ updatedAt: new Date("2026-11-25T00:00:00+09:00") })],
      isResumeShown: false,
      isPortfolioShown: false,
    });

    expect(updated).toContain("(분류 React, 2026년 11월 21일 씀, 2026년 11월 25일 고침)");
  });

  it("링크 글의 대괄호가 마크다운 링크를 끊지 않게 막는다", () => {
    const bracketed = createLlmsTxt({
      posts: [createPost({ title: "[실험] 이벤트 루프" })],
      isResumeShown: false,
      isPortfolioShown: false,
    });

    expect(bracketed).toContain("- [\\[실험\\] 이벤트 루프](https://eastar-ds.github.io/posts/");
  });

  it("소개 페이지를 넣고, 페이지가 없는 이력서와 포트폴리오는 빼며, 보조 링크는 Optional 절에 둔다", () => {
    expect(llms).toContain(
      "## 글쓴이\n\n- [소개](https://eastar-ds.github.io/about/): 글쓴이 이스타(김동성)를 소개하고 지금까지 한 일을 적은 페이지입니다.",
    );
    expect(llms).not.toContain("/resume/");
    expect(llms).not.toContain("/portfolio/");
    expect(llms).toContain("## Optional\n\n- [RSS](https://eastar-ds.github.io/rss.xml):");
  });

  it("포트폴리오와 이력서는 페이지가 있을 때 따로 넣는다", () => {
    const portfolioOnly = createLlmsTxt({ posts: [], isResumeShown: false, isPortfolioShown: true });
    const both = createLlmsTxt({ posts: [], isResumeShown: true, isPortfolioShown: true });

    expect(portfolioOnly).toContain("- [포트폴리오](https://eastar-ds.github.io/portfolio/):");
    expect(portfolioOnly).not.toContain("/resume/");
    expect(both).toContain("- [이력서](https://eastar-ds.github.io/resume/):");
  });

  it("제목은 규격대로 H1 하나와 H2 절만 쓴다", () => {
    expect(llms.match(/^#{3,} /m)).toBeNull();
    expect(llms.match(/^# /gm)).toHaveLength(1);
  });
});

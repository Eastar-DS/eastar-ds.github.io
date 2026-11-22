import { describe, expect, it } from "vitest";

import createPageMeta from ".";

describe("createPageMeta", () => {
  it("제목 뒤에 사이트 이름을 붙이고 canonical을 절대 주소로 만든다", () => {
    const meta = createPageMeta({
      title: "목록 가상화",
      description: "요약",
      path: "/posts/virtualized-document-list/",
      ogType: "article",
      publishedAt: new Date("2026-11-18T00:00:00Z"),
    });

    expect(meta.title).toBe("목록 가상화 · 이스타의 개발 노트");
    expect(meta.canonicalUrl).toBe(
      "https://eastar-ds.github.io/posts/virtualized-document-list/",
    );
    expect(meta.ogType).toBe("article");
    expect(meta.publishedTime).toBe("2026-11-18T00:00:00+09:00");
  });

  it("og:title에는 사이트 이름을 붙이지 않는다", () => {
    const meta = createPageMeta({ title: "목록 가상화", path: "/posts/virtualized-document-list/", ogType: "article" });

    expect(meta.ogTitle).toBe("목록 가상화");
  });

  it("글은 글 주소 아래의 공유 그림을 쓴다", () => {
    const meta = createPageMeta({ title: "목록 가상화", path: "/posts/virtualized-document-list/", ogType: "article" });

    expect(meta.image).toEqual({
      url: "https://eastar-ds.github.io/posts/virtualized-document-list/og.png",
      alt: "목록 가상화",
      width: 1200,
      height: 630,
      type: "image/png",
    });
  });

  it("제목이 없으면 사이트 이름과 사이트 설명, 사이트 기본 그림을 쓴다", () => {
    const meta = createPageMeta({ path: "/" });

    expect(meta.title).toBe("이스타의 개발 노트");
    expect(meta.ogTitle).toBe("이스타의 개발 노트");
    expect(meta.description).toContain("공부하며");
    expect(meta.ogType).toBe("website");
    expect(meta.image.url).toBe("https://eastar-ds.github.io/og.png");
  });

  it("hasCanonical이 false면 canonical 주소를 비운다", () => {
    const meta = createPageMeta({ title: "찾는 글이 없습니다", path: "/404.html", hasCanonical: false });

    expect(meta.canonicalUrl).toBeUndefined();
  });
});

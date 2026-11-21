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
    expect(meta.publishedTime).toBe("2026-11-18T00:00:00.000Z");
  });

  it("제목이 없으면 사이트 이름과 사이트 설명을 쓴다", () => {
    const meta = createPageMeta({ path: "/" });

    expect(meta.title).toBe("이스타의 개발 노트");
    expect(meta.description).toContain("공부하며");
    expect(meta.ogType).toBe("website");
  });
});

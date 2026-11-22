import { describe, expect, it } from "vitest";

import parseFrontmatter, { toPostMeta } from "./parseFrontmatter.ts";

describe("parseFrontmatter", () => {
  it("정본 1장 예의 앞머리를 읽는다", () => {
    const source = [
      "---",
      'title: "브라우저는 언제 화면을 다시 그릴까: 레이아웃과 페인트"',
      "description: '작은 따옴표 안의 ''인용''도 읽습니다.'",
      "publishedAt: 2026-11-18",
      "updatedAt: 2026-11-20 # 내용을 고쳤을 때만",
      "projects: [knot, bid]",
      "draft: true",
      "category: 브라우저",
      "series:",
      "  name: 브라우저 렌더링",
      "  order: 1",
      "---",
      "",
      "본문",
    ].join("\n");
    const { data, bodyStartLine, errors } = parseFrontmatter(source);

    expect(errors).toEqual([]);
    expect(bodyStartLine).toBe(13);
    expect(toPostMeta(data)).toEqual({
      title: "브라우저는 언제 화면을 다시 그릴까: 레이아웃과 페인트",
      description: "작은 따옴표 안의 '인용'도 읽습니다.",
      publishedAt: "2026-11-18",
      updatedAt: "2026-11-20",
      category: "브라우저",
      series: { name: "브라우저 렌더링", order: 1 },
      projects: ["knot", "bid"],
      draft: true,
    });
  });

  it("draft 줄이 없으면 초안이 아니다", () => {
    expect(toPostMeta(parseFrontmatter("---\ntitle: 글\n---\n").data).draft).toBe(false);
    expect(toPostMeta(parseFrontmatter("---\ndraft: false\n---\n").data).draft).toBe(false);
  });

  it("들여쓴 - 목록을 읽는다", () => {
    expect(parseFrontmatter("---\nprojects:\n  - knot\n  - bid\n---\n").data.projects).toEqual(["knot", "bid"]);
  });

  it("앞머리가 없으면 본문이 1줄부터다", () => {
    expect(parseFrontmatter("## 제목\n").bodyStartLine).toBe(1);
  });

  it("닫히지 않은 따옴표나 닫는 줄이 없는 앞머리는 오류로 알린다", () => {
    expect(parseFrontmatter('---\ntitle: "닫히지 않음\n---\n').errors).toEqual([{ line: 2, message: '값을 읽지 못했습니다: title: "닫히지 않음' }]);
    expect(parseFrontmatter("---\ntitle: 글\n").errors[0]?.message).toBe("앞머리를 닫는 `---` 줄이 없습니다");
  });
});

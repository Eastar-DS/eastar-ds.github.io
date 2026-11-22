import { describe, expect, it } from "vitest";

import { createPostSource, findSlugProblem, toKoreanDate } from "./postTemplate.ts";

describe("findSlugProblem", () => {
  it.each(["virtualized-document-list", "browser-rendering-steps", "http2-server-push-notes", "a-b-c-d-e"])(
    "%s는 받는다",
    (slug) => {
      expect(findSlugProblem(slug)).toBeUndefined();
    },
  );

  it.each([
    ["", "적어 주세요"],
    ["Virtual-List-Row", "소문자"],
    ["목록-가상화-정리", "한글"],
    ["virtual list row", "한글과 빈칸"],
    ["2026-11-virtual-list", "숫자만인 낱말"],
    ["virtual-list-part-2", "숫자만인 낱말"],
    ["virtual-list", "3~5개"],
    ["one-two-three-four-five-six", "3~5개"],
    ["-virtual-list-row", "3~5개"],
    ["virtual--list-row", "3~5개"],
  ])("%s는 까닭을 알린다", (slug, reason) => {
    expect(findSlugProblem(slug)).toContain(reason);
  });
});

describe("toKoreanDate", () => {
  it("UTC로 전날 밤이어도 한국 날짜를 쓴다", () => {
    expect(toKoreanDate(new Date("2026-12-31T16:00:00Z"))).toBe("2027-01-01");
  });
});

describe("createPostSource", () => {
  const source = createPostSource({ publishedAt: "2026-11-22" });

  it("앞머리에 쓴 날, 분류, 초안 표시를 둔다", () => {
    expect(source).toMatch(/^---\ntitle: ""/);
    expect(source).toContain("\npublishedAt: 2026-11-22\n");
    expect(source).toContain("\ncategory: 도구 ");
    expect(source).toContain("\ndraft: true ");
  });

  it("본문 끝에 「정리」 절 자리를 둔다", () => {
    expect(source).toContain("\n## 정리\n\n- ");
  });
});

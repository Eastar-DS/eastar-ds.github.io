import { describe, expect, it } from "vitest";

import findReviewMarkers from "./findReviewMarkers.ts";

describe("findReviewMarkers", () => {
  it("〔이스타 확인〕 표시를 줄마다 찾는다", () => {
    const source = "---\ntitle: 글\n---\n\n문장 〔이스타 확인: 배운 점〕 그리고 〔이스타 확인〕\n";

    expect(findReviewMarkers({ source })).toEqual([
      { line: 5, text: "〔이스타 확인: 배운 점〕" },
      { line: 5, text: "〔이스타 확인〕" },
    ]);
  });

  it("본문 시작 줄 앞은 보지 않는다", () => {
    expect(findReviewMarkers({ source: "〔이스타 확인〕\n본문", fromLine: 2 })).toEqual([]);
  });
});

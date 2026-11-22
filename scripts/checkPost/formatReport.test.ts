import { describe, expect, it } from "vitest";

import { displayWidth, formatGithubAnnotations, formatJson, formatText, type PostReport } from "./formatReport.ts";

const REPORT: PostReport = {
  slug: "virtualized-document-list",
  file: "src/content/posts/virtualized-document-list/index.mdx",
  title: "라이브러리 없이 목록 가상화하기: 966ms를 46ms로",
  draft: false,
  results: [
    { id: "title-length", label: "제목 길이", status: "pass", summary: "31자", findings: [], basis: "docs/content-guide.md 2.1", section: "10.1" },
    {
      id: "review-marker",
      label: "〔이스타 확인〕 표시",
      status: "fail",
      summary: "1개",
      findings: [{ line: 123, message: "〔이스타 확인: 배운 점〕" }],
      basis: "docs/content-guide.md 12장",
      section: "12장",
      fix: "이스타에게 묻습니다.",
    },
    { id: "dist-js", label: "페이지 JS (gzip)", status: "skip", summary: "초안이라 배포 빌드에 글이 없습니다", findings: [], basis: "docs/content-guide.md 10.6", section: "10.6" },
  ],
};

describe("formatText", () => {
  it("실패를 찾은 곳, 고칠 방법, 근거와 함께 보이고 통과와 건너뜀은 이름만 모은다", () => {
    expect(formatText({ reports: [REPORT] })).toBe(
      [
        "■ virtualized-document-list 「라이브러리 없이 목록 가상화하기: 966ms를 46ms로」",
        "  src/content/posts/virtualized-document-list/index.mdx",
        "  실패 1 · 경고 0 · 건너뜀 1 · 통과 1",
        "",
        "  결과    절    항목                  내용",
        "  실패    12장  〔이스타 확인〕 표시  1개",
        "                                      123줄  〔이스타 확인: 배운 점〕",
        "                                      고칠 방법: 이스타에게 묻습니다.",
        "                                      근거: docs/content-guide.md 12장",
        "",
        "  건너뜀 1개(초안이라 배포 빌드에 글이 없습니다): 페이지 JS (gzip)",
        "",
        "  통과 1개: 제목 길이",
      ].join("\n"),
    );
  });
});

describe("displayWidth", () => {
  it("한글과 낫표는 두 칸, 영어와 숫자는 한 칸으로 센다", () => {
    expect(displayWidth("「정리」 h2")).toBe(11);
  });
});

describe("formatJson", () => {
  it("통과까지 모든 항목과 글별, 전체 수를 낸다", () => {
    const json = JSON.parse(formatJson([REPORT])) as { summary: Record<string, number>; posts: { summary: Record<string, number>; results: unknown[] }[] };

    expect(json.summary).toEqual({ posts: 1, fail: 1, warn: 0, skip: 1, pass: 1 });
    expect(json.posts[0]?.results).toHaveLength(3);
  });
});

describe("formatGithubAnnotations", () => {
  it("실패한 곳마다 파일과 줄을 붙인 ::error 줄을 만든다", () => {
    expect(formatGithubAnnotations([REPORT])).toEqual([
      "::error file=src/content/posts/virtualized-document-list/index.mdx,line=123,title=〔이스타 확인〕 표시::〔이스타 확인: 배운 점〕",
    ]);
  });
});

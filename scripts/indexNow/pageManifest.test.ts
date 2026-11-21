import { describe, expect, it } from "vitest";

import { createPageManifest, extractPageText, toPagePath } from "./pageManifest.ts";

const page = ({ main, title = "글 · 이스타의 개발 노트", head = "" }: { main: string; title?: string; head?: string }) => `<!doctype html>
<html lang="ko"><head><title>${title}</title><meta name="description" content="요약">${head}
<link rel="stylesheet" href="/_astro/index.B0Efr2ag.css"></head>
<body><header class="header" data-astro-cid-abc>머리말 메뉴</header>
<main id="main" tabindex="-1">${main}</main>
<footer>© 2026 이스타</footer></body></html>`;

describe("toPagePath", () => {
  it("index.html을 끝에 / 가 붙은 페이지 주소로 바꾼다", () => {
    expect(toPagePath("index.html")).toBe("/");
    expect(toPagePath("about/index.html")).toBe("/about/");
    expect(toPagePath("posts/virtualized-document-list/index.html")).toBe("/posts/virtualized-document-list/");
  });

  it("윈도의 \\ 경로도 같은 주소로 바꾼다", () => {
    expect(toPagePath("posts\\virtualized-document-list\\index.html")).toBe("/posts/virtualized-document-list/");
  });

  it("404.html처럼 주소가 없는 파일은 고르지 않는다", () => {
    expect(toPagePath("404.html")).toBeUndefined();
  });
});

describe("extractPageText", () => {
  it("제목, 요약, 본문 글만 꺼내고 머리말, 꼬리말, 태그 속성, 스크립트는 뺀다", () => {
    expect(
      extractPageText(
        page({ main: `<h1 class="title" data-astro-cid-x>제목</h1>\n<p>첫   문단</p><script>console.log("숨은 글")</script><!-- 주석 -->` }),
      ),
    ).toBe("글 · 이스타의 개발 노트\n요약\n제목 첫 문단");
  });

  it("검색에 내보내지 않는 페이지(noindex)는 고르지 않는다", () => {
    expect(extractPageText(page({ main: "<p>없음</p>", head: '<meta name="robots" content="noindex">' }))).toBeUndefined();
  });
});

describe("createPageManifest", () => {
  it("화면 모양(클래스, 빌드 파일 이름)만 바뀌면 같은 해시를 낸다", () => {
    const before = createPageManifest([{ file: "about/index.html", html: page({ main: '<p class="a">소개</p>' }) }]);
    const after = createPageManifest([
      {
        file: "about/index.html",
        html: page({ main: '<p class="b" data-astro-cid-new>소개</p>' }).replace("index.B0Efr2ag.css", "index.Zz99.css"),
      },
    ]);

    expect(after).toEqual(before);
  });

  it("본문 글이 바뀌면 다른 해시를 낸다", () => {
    const before = createPageManifest([{ file: "about/index.html", html: page({ main: "<p>소개</p>" }) }]);
    const after = createPageManifest([{ file: "about/index.html", html: page({ main: "<p>소개를 고침</p>" }) }]);

    expect(after["/about/"]).not.toBe(before["/about/"]);
  });

  it("404와 noindex 페이지는 목록에 넣지 않는다", () => {
    const manifest = createPageManifest([
      { file: "index.html", html: page({ main: "<p>글 목록</p>" }) },
      { file: "404.html", html: page({ main: "<p>찾는 글이 없습니다</p>" }) },
      { file: "draft/index.html", html: page({ main: "<p>숨김</p>", head: '<meta name="robots" content="noindex">' }) },
    ]);

    expect(Object.keys(manifest)).toEqual(["/"]);
  });
});

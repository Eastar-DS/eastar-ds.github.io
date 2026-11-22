import { describe, expect, it } from "vitest";

import { parsePostLastmod } from "@/shared/content/readPostLastmods";

import addPostLastmod from ".";

const lastmods = new Map([["virtualized-document-list", new Date("2026-11-21T00:00:00+09:00")]]);

describe("addPostLastmod", () => {
  it("글 주소에는 그 글의 lastmod를 붙인다", () => {
    const item = { url: "https://eastar-ds.github.io/posts/virtualized-document-list/" };

    expect(addPostLastmod({ item, lastmods })).toEqual({
      url: item.url,
      lastmod: "2026-11-20T15:00:00.000Z",
    });
  });

  it("앞머리의 한국 달력 날짜를 UTC 전날 15시인 lastmod로 내보낸다", () => {
    const lastmod = parsePostLastmod("---\npublishedAt: 2026-11-21\n---\n");
    const result = addPostLastmod({ item: { url: "https://eastar-ds.github.io/posts/example-post/" }, lastmods: new Map([["example-post", lastmod!]]) });
    expect(result.lastmod).toBe("2026-11-20T15:00:00.000Z");
  });

  it("글이 아닌 페이지와 글 아래 다른 주소에는 붙이지 않는다", () => {
    const pages = [
      "https://eastar-ds.github.io/",
      "https://eastar-ds.github.io/about/",
      "https://eastar-ds.github.io/posts/virtualized-document-list/og.png",
    ];

    pages.forEach((url) => expect(addPostLastmod({ item: { url }, lastmods })).toEqual({ url }));
  });

  it("날짜를 모르는 글은 그대로 둔다", () => {
    const item = { url: "https://eastar-ds.github.io/posts/unknown-post/" };

    expect(addPostLastmod({ item, lastmods })).toEqual(item);
  });
});

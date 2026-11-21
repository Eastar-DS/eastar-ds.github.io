import { describe, expect, it } from "vitest";

import addPostLastmod from ".";

const lastmods = new Map([["virtualized-document-list", new Date("2026-11-20T00:00:00Z")]]);

describe("addPostLastmod", () => {
  it("글 주소에는 그 글의 lastmod를 붙인다", () => {
    const item = { url: "https://eastar-ds.github.io/posts/virtualized-document-list/" };

    expect(addPostLastmod({ item, lastmods })).toEqual({
      url: item.url,
      lastmod: "2026-11-20T00:00:00.000Z",
    });
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

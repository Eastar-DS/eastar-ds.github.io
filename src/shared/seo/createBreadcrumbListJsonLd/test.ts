import { describe, expect, it } from "vitest";

import createBreadcrumbListJsonLd from ".";

describe("createBreadcrumbListJsonLd", () => {
  it("순서대로 position을 매기고 절대 주소를 쓴다", () => {
    const jsonLd = createBreadcrumbListJsonLd([
      { name: "이스타의 개발 노트", path: "/" },
      { name: "목록 가상화", path: "/posts/virtualized-document-list/" },
    ]);

    expect(jsonLd.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "이스타의 개발 노트",
        item: "https://eastar-ds.github.io/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "목록 가상화",
        item: "https://eastar-ds.github.io/posts/virtualized-document-list/",
      },
    ]);
  });
});

import { describe, expect, it } from "vitest";

import createPersonJsonLd from ".";

describe("createPersonJsonLd", () => {
  it("이름, 소개 페이지 주소, GitHub 주소를 담는다", () => {
    expect(createPersonJsonLd()).toEqual({
      "@type": "Person",
      "@id": "https://eastar-ds.github.io/about/#person",
      name: "이스타",
      url: "https://eastar-ds.github.io/about/",
      sameAs: ["https://github.com/eastar-DS"],
    });
  });
});

import { describe, expect, it } from "vitest";

import createPersonJsonLd from ".";

describe("createPersonJsonLd", () => {
  it("본명을 이름으로, 블로그 이름을 다른 이름으로 두고 소개 페이지 주소와 GitHub 주소를 담는다", () => {
    expect(createPersonJsonLd()).toEqual({
      "@type": "Person",
      "@id": "https://eastar-ds.github.io/about/#person",
      name: "김동성",
      alternateName: "이스타",
      url: "https://eastar-ds.github.io/about/",
      sameAs: ["https://github.com/eastar-DS"],
    });
  });

  it("이메일은 넣지 않는다", () => {
    expect(createPersonJsonLd()).not.toHaveProperty("email");
  });
});

import { describe, expect, it } from "vitest";

import createProfilePageJsonLd from ".";

describe("createProfilePageJsonLd", () => {
  it("소개 페이지 주소, 소개를 고친 날(한국 시간), 소개하는 사람으로 글쓴이 Person을 담는다", () => {
    expect(createProfilePageJsonLd()).toMatchObject({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url: "https://eastar-ds.github.io/about/",
      dateModified: "2026-11-21T00:00:00+09:00",
      mainEntity: {
        "@type": "Person",
        name: "김동성",
        alternateName: "이스타",
        sameAs: ["https://github.com/eastar-DS"],
      },
    });
  });
});

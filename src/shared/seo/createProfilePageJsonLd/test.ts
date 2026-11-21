import { describe, expect, it } from "vitest";

import createProfilePageJsonLd from ".";

describe("createProfilePageJsonLd", () => {
  it("소개 페이지 주소와, 소개하는 사람으로 글쓴이 Person을 담는다", () => {
    expect(createProfilePageJsonLd()).toMatchObject({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url: "https://eastar-ds.github.io/about/",
      mainEntity: {
        "@type": "Person",
        name: "이스타",
        sameAs: ["https://github.com/eastar-DS"],
      },
    });
  });
});

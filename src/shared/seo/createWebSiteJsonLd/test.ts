import { describe, expect, it } from "vitest";

import createWebSiteJsonLd from ".";

describe("createWebSiteJsonLd", () => {
  it("사이트 이름과, 첫 화면 canonical과 같은 주소를 담는다", () => {
    expect(createWebSiteJsonLd()).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "이스타의 개발 노트",
      url: "https://eastar-ds.github.io/",
      inLanguage: "ko",
    });
  });
});

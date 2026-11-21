import { describe, expect, it } from "vitest";

import createPersonJsonLd from ".";

describe("createPersonJsonLd", () => {
  it("본명을 이름으로, 블로그 이름을 다른 이름으로, 한 줄 소개를 설명으로 두고 소개 페이지 주소와 GitHub 주소를 담는다", () => {
    expect(createPersonJsonLd()).toEqual({
      "@type": "Person",
      "@id": "https://eastar-ds.github.io/about/#person",
      name: "김동성",
      alternateName: "이스타",
      description: "도메인에 진심으로 달려드는 프론트엔드 엔지니어",
      url: "https://eastar-ds.github.io/about/",
      sameAs: ["https://github.com/eastar-DS"],
    });
  });

  it("이메일, 직함, 사진은 넣지 않는다", () => {
    const person = createPersonJsonLd();

    expect(person).not.toHaveProperty("email");
    expect(person).not.toHaveProperty("jobTitle");
    expect(person).not.toHaveProperty("image");
  });
});

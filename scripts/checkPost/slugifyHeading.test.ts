import { describe, expect, it } from "vitest";

import createHeadingSlugger, { slugify, toHeadingText } from "./slugifyHeading.ts";

// 기대값은 빌드 결과(dist)의 글 페이지에 실제로 붙은 id에서 옮겼습니다(2026-11-21 빌드)
describe("slugify", () => {
  it("문장 부호를 빼고 공백을 하이픈으로 바꾼다", () => {
    expect(slugify("「주제별」 목록은 왜 느렸을까")).toBe("주제별-목록은-왜-느렸을까");
    expect(slugify("aria-posinset과 aria-setsize는 무엇을 알릴까")).toBe("aria-posinset과-aria-setsize는-무엇을-알릴까");
  });

  it("영어는 소문자로 바꾸고 마침표, 물음표, 쌍점을 뺀다", () => {
    expect(slugify("React 19.2: 무엇이 바뀌었나?")).toBe("react-192-무엇이-바뀌었나");
  });

  it("동그라미 숫자 같은 기타 숫자는 빼고 밑줄은 남긴다", () => {
    expect(slugify("① snake_case")).toBe("-snake_case");
  });
});

describe("createHeadingSlugger", () => {
  it("한 글 안에서 같은 id가 다시 나오면 번호를 붙인다", () => {
    const slug = createHeadingSlugger();

    expect([slug("정리"), slug("정리"), slug("정리")]).toEqual(["정리", "정리-1", "정리-2"]);
  });
});

describe("toHeadingText", () => {
  it("인라인 코드의 백틱과 링크 주소를 빼고 화면에 보이는 글만 남긴다", () => {
    expect(toHeadingText("`flushSync`를 [모든](https://react.dev) scroll 이벤트에 걸면")).toBe("flushSync를 모든 scroll 이벤트에 걸면");
    expect(toHeadingText("**굵은** 제목")).toBe("굵은 제목");
  });
});

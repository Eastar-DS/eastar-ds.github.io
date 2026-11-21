import { describe, expect, it } from "vitest";

import validateCommentInput, { countCharacters, normalizeContent, normalizeNickname } from "./validateCommentInput";

const validBody = {
  postPath: "/posts/browser-layout-and-paint/",
  nickname: "방문자",
  content: "좋은 글 고맙습니다.",
  turnstileToken: "token",
  homepage: "",
};

describe("validateCommentInput", () => {
  it("올바른 본문은 다듬은 값으로 돌려준다", () => {
    expect(validateCommentInput({ ...validBody, nickname: "  지나가던   개발자 ", content: "첫 줄\r\n\r\n\r\n\r\n둘째 줄  " })).toEqual({
      isValid: true,
      comment: {
        postPath: "/posts/browser-layout-and-paint/",
        nickname: "지나가던 개발자",
        content: "첫 줄\n\n둘째 줄",
        parentId: null,
        turnstileToken: "token",
      },
    });
  });

  it.each([
    [null, "invalid_request"],
    ["문자열", "invalid_request"],
    [{ ...validBody, postPath: "/about/" }, "invalid_request"],
    [{ ...validBody, postPath: "/posts/한글/" }, "invalid_request"],
    [{ ...validBody, homepage: "x" }, "spam_suspected"],
    [{ ...validBody, parentId: "1234" }, "invalid_parent"],
    [{ ...validBody, nickname: "" }, "nickname_required"],
    [{ ...validBody, content: "\n\n" }, "content_required"],
    [{ ...validBody, turnstileToken: "" }, "turnstile_failed"],
    [{ ...validBody, turnstileToken: "x".repeat(2049) }, "turnstile_failed"],
    [{ ...validBody, nickname: "글쓴이" }, "nickname_blocked"],
  ])("%j → %s", (body, error) => {
    expect(validateCommentInput(body)).toEqual({ isValid: false, error });
  });

  it("그림 문자 하나는 한 글자로 센다", () => {
    expect(countCharacters("👍".repeat(20))).toBe(20);
    expect(validateCommentInput({ ...validBody, nickname: "👍".repeat(20) }).isValid).toBe(true);
    expect(validateCommentInput({ ...validBody, nickname: "👍".repeat(21) })).toEqual({
      isValid: false,
      error: "nickname_too_long",
    });
  });
});

describe("normalizeNickname · normalizeContent", () => {
  it("보이지 않는 방향 바꿈 글자와 제어 문자를 지운다", () => {
    expect(normalizeNickname("방‮문\u0007자")).toBe("방문자");
    expect(normalizeContent("가\u0000나\t다")).toBe("가나\t다");
  });
});

import { describe, expect, it } from "vitest";

import validateCommentDraft from "./validateCommentDraft";

describe("validateCommentDraft", () => {
  it.each([
    [{ nickname: "", content: "내용" }, "nickname_required"],
    [{ nickname: "  ", content: "내용" }, "nickname_required"],
    [{ nickname: "방문자", content: "\n " }, "content_required"],
    [{ nickname: "방문자", content: "내용" }, null],
  ])("%j → %s", (draft, expected) => {
    expect(validateCommentDraft(draft)).toBe(expected);
  });
});

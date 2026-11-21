import { describe, expect, it } from "vitest";

import toCommentErrorMessage from "./toCommentErrorMessage";

describe("toCommentErrorMessage", () => {
  it.each([
    ["nickname_blocked", "이 닉네임은 쓸 수 없습니다. 다른 닉네임을 적어 주세요.", "nickname"],
    ["nickname_too_long", "닉네임은 20자까지 쓸 수 있습니다.", "nickname"],
    ["content_too_long", "댓글은 1000자까지 쓸 수 있습니다.", "content"],
    ["too_many_requests", "댓글을 너무 자주 남겼습니다. 1분 뒤에 다시 남겨 주세요.", null],
    ["spam_suspected", "댓글을 남기지 못했습니다. 페이지를 새로 고친 뒤 다시 남겨 주세요.", null],
  ])("%s → 「%s」", (code, message, field) => {
    expect(toCommentErrorMessage(code)).toEqual({ message, field });
  });

  it.each(["storage_failed", "network_error", undefined])("모르는 값(%s)은 「잠시 뒤 다시」 안내다", (code) => {
    expect(toCommentErrorMessage(code)).toEqual({
      message: "댓글을 저장하지 못했습니다. 잠시 뒤 다시 남겨 주세요.",
      field: null,
    });
  });
});

import { describe, expect, it } from "vitest";

import formatCommentTime from "./formatCommentTime";

describe("formatCommentTime", () => {
  it("한국 시간으로 날짜와 시각을 보인다", () => {
    expect(formatCommentTime("2026-11-20T09:12:00.000Z")).toBe("2026.11.20 18:12");
  });

  it("UTC로 전날 밤이면 한국 날짜로 넘어간다", () => {
    expect(formatCommentTime("2026-11-20T15:05:00.000Z")).toBe("2026.11.21 00:05");
  });

  it("읽을 수 없는 값은 빈 글이다", () => {
    expect(formatCommentTime("")).toBe("");
  });
});

import { describe, expect, it } from "vitest";

import type { CommentRecord } from "../types/comment";
import buildCommentThreads, { isVisibleComment } from "./buildCommentThreads";

const record = (overrides: Partial<CommentRecord> & Pick<CommentRecord, "id">): CommentRecord => ({
  postPath: "/posts/a/",
  nickname: "방문자",
  content: "내용",
  parentId: null,
  isAuthorReply: false,
  isHidden: false,
  isApproved: false,
  createdAt: "2026-11-21T00:00:00.000Z",
  ...overrides,
});

describe("isVisibleComment", () => {
  it.each([
    [{ isHidden: true }, "immediate", false],
    [{}, "immediate", true],
    [{}, "approval", false],
    [{ isApproved: true }, "approval", true],
    [{ isAuthorReply: true }, "approval", true],
    [{ isApproved: true, isHidden: true }, "approval", false],
  ] as const)("%j · %s → %s", (overrides, moderation, expected) => {
    expect(isVisibleComment({ record: record({ id: "a", ...overrides }), moderation })).toBe(expected);
  });
});

describe("buildCommentThreads", () => {
  it("쓴 시각 순서로 최상위 댓글과 답글을 묶는다", () => {
    const threads = buildCommentThreads({
      moderation: "immediate",
      records: [
        record({ id: "b", createdAt: "2026-11-21T02:00:00.000Z" }),
        record({ id: "a-2", parentId: "a", createdAt: "2026-11-21T04:00:00.000Z" }),
        record({ id: "a", createdAt: "2026-11-21T01:00:00.000Z" }),
        record({ id: "a-1", parentId: "a", createdAt: "2026-11-21T03:00:00.000Z" }),
      ],
    });

    expect(threads.map((thread) => [thread.id, thread.replies.map((reply) => reply.id)])).toEqual([
      ["a", ["a-1", "a-2"]],
      ["b", []],
    ]);
  });

  it("이스타가 답글을 부모로 고른 답글은 그 최상위 댓글 아래에 둔다(늘 한 단계)", () => {
    const threads = buildCommentThreads({
      moderation: "immediate",
      records: [
        record({ id: "a" }),
        record({ id: "a-1", parentId: "a" }),
        record({ id: "author", parentId: "a-1", isAuthorReply: true, nickname: "" }),
      ],
    });

    expect(threads[0]?.replies.map((reply) => [reply.id, reply.nickname, reply.isAuthor])).toEqual([
      ["a-1", "방문자", false],
      ["author", "이스타", true],
    ]);
  });

  it("부모가 없거나 숨겨진 답글, 내용이 빈 줄은 뺀다", () => {
    const threads = buildCommentThreads({
      moderation: "immediate",
      records: [
        record({ id: "a" }),
        record({ id: "orphan", parentId: "missing" }),
        record({ id: "hidden", isHidden: true }),
        record({ id: "hidden-reply", parentId: "hidden" }),
        record({ id: "empty", content: "  " }),
      ],
    });

    expect(threads.map((thread) => thread.id)).toEqual(["a"]);
    expect(threads[0]?.replies).toEqual([]);
  });

  it("관리 값(숨김 · 승인 · 글 주소)은 응답에 넣지 않는다", () => {
    const [thread] = buildCommentThreads({ moderation: "immediate", records: [record({ id: "a" })] });

    expect(Object.keys(thread ?? {}).sort()).toEqual(["content", "createdAt", "id", "isAuthor", "nickname", "replies"]);
  });
});

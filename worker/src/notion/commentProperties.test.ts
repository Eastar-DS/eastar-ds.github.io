import { describe, expect, it } from "vitest";

import { COMMENT_COLUMNS } from "../constants/notion";
import { toCommentRecord, toRichText } from "./commentProperties";

describe("toRichText", () => {
  it("노션 글자 칸 하나의 한도(2000자)로 나눈다", () => {
    const chunks = toRichText("가".repeat(4500));

    expect(chunks.map((chunk) => chunk.text.content.length)).toEqual([2000, 2000, 500]);
  });

  it("빈 글은 빈 배열이다", () => {
    expect(toRichText("")).toEqual([]);
  });
});

describe("toCommentRecord", () => {
  it("칸이 없거나 비어 있으면 빈 값으로 읽고, 휴지통에 간 줄은 숨김으로 본다", () => {
    expect(toCommentRecord({ id: "x", created_time: "2026-11-21T00:00:00.000Z", in_trash: true })).toEqual({
      id: "x",
      postPath: "",
      nickname: "",
      content: "",
      parentId: null,
      isAuthorReply: false,
      isHidden: true,
      isApproved: false,
      createdAt: "2026-11-21T00:00:00.000Z",
    });
  });

  it("여러 조각으로 나뉜 제목을 이어 읽는다", () => {
    const record = toCommentRecord({
      id: "x",
      properties: { [COMMENT_COLUMNS.content]: { title: [{ plain_text: "앞" }, { plain_text: "뒤" }] } },
    });

    expect(record.content).toBe("앞뒤");
  });
});

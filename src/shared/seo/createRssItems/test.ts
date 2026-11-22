import { describe, expect, it } from "vitest";

import type { Post } from "@/shared/types/post";

import createRssItems from ".";

const post: Post = {
  slug: "virtualized-document-list",
  title: "제목",
  description: "요약",
  category: "브라우저",
  publishedAt: new Date("2026-11-18T00:00:00Z"),
  updatedAt: new Date("2026-11-18T00:00:00Z"),
  readingMinutes: 6,
};

describe("createRssItems", () => {
  it("글 주소와 발행일, 주제, 요약과 본문을 RSS 항목에 담는다", () => {
    const contents = new Map([["virtualized-document-list", "<p>본문</p>"]]);

    expect(createRssItems({ posts: [post], contents })).toEqual([
      {
        title: "제목",
        description: "요약",
        pubDate: post.publishedAt,
        link: "/posts/virtualized-document-list/",
        categories: ["브라우저"],
        content: "<p>본문</p>",
      },
    ]);
  });

  it("본문이 없는 글은 요약만 싣는다", () => {
    expect(createRssItems({ posts: [post] })[0]?.content).toBeUndefined();
  });
});

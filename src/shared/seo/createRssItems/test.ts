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
  it("글 주소와 발행일, 주제를 RSS 항목에 담는다", () => {
    expect(createRssItems([post])).toEqual([
      {
        title: "제목",
        description: "요약",
        pubDate: post.publishedAt,
        link: "/posts/virtualized-document-list/",
        categories: ["브라우저"],
      },
    ]);
  });
});

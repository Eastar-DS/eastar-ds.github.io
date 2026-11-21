import { describe, expect, it } from "vitest";

import type { Post } from "@/shared/types/post";

import groupPostsByYear from ".";

const createPost = (slug: string, publishedAt: string): Post => ({
  slug,
  title: slug,
  description: "",
  category: "브라우저",
  publishedAt: new Date(publishedAt),
  updatedAt: new Date(publishedAt),
  readingMinutes: 1,
});

describe("groupPostsByYear", () => {
  it("발행 연도별로 묶고 순서를 지킨다", () => {
    const posts = [
      createPost("c", "2026-11-18T00:00:00Z"),
      createPost("b", "2026-10-01T00:00:00Z"),
      createPost("a", "2025-12-20T00:00:00Z"),
    ];

    expect(
      groupPostsByYear(posts).map((group) => ({
        year: group.year,
        slugs: group.posts.map((post) => post.slug),
      })),
    ).toEqual([
      { year: "2026", slugs: ["c", "b"] },
      { year: "2025", slugs: ["a"] },
    ]);
  });

  it("글이 없으면 빈 배열을 돌려준다", () => {
    expect(groupPostsByYear([])).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import type { Post } from "@/shared/types/post";

import findAdjacentPosts from ".";

const createPost = (
  slug: string,
  publishedAt: string,
  series?: { name: string; order: number },
): Post => ({
  slug,
  title: slug,
  description: "",
  category: "브라우저",
  publishedAt: new Date(publishedAt),
  updatedAt: new Date(publishedAt),
  readingMinutes: 1,
  series,
});

const posts = [
  createPost("rendering-2", "2026-11-20T00:00:00Z", { name: "렌더링", order: 2 }),
  createPost("single-new", "2026-11-10T00:00:00Z"),
  createPost("rendering-1", "2026-10-01T00:00:00Z", { name: "렌더링", order: 1 }),
  createPost("single-mid", "2026-09-01T00:00:00Z"),
  createPost("single-old", "2026-08-01T00:00:00Z"),
];

const pickSlugs = (slug: string) => {
  const { prev, next } = findAdjacentPosts({ posts, slug });

  return [prev?.slug, next?.slug];
};

describe("findAdjacentPosts", () => {
  it("시리즈 글은 같은 시리즈의 앞뒤 편을 잇는다", () => {
    expect(pickSlugs("rendering-1")).toEqual([undefined, "rendering-2"]);
    expect(pickSlugs("rendering-2")).toEqual(["rendering-1", undefined]);
  });

  it("시리즈가 아닌 글은 모든 글의 발행일로 앞뒤 글을 잇는다", () => {
    expect(pickSlugs("single-mid")).toEqual(["single-old", "rendering-1"]);
    expect(pickSlugs("single-new")).toEqual(["rendering-1", "rendering-2"]);
  });

  it("없는 글이면 둘 다 없다", () => {
    expect(pickSlugs("missing")).toEqual([undefined, undefined]);
  });
});

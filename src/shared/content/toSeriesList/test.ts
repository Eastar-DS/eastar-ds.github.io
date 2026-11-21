import { describe, expect, it } from "vitest";

import type { Post } from "@/shared/types/post";

import toSeriesList from ".";

const createPost = (
  slug: string,
  series?: { name: string; order: number },
): Post => ({
  slug,
  title: slug,
  description: "",
  category: "브라우저",
  publishedAt: new Date("2026-11-18T00:00:00Z"),
  updatedAt: new Date("2026-11-18T00:00:00Z"),
  readingMinutes: 1,
  series,
});

describe("toSeriesList", () => {
  it("시리즈별 글 수와 첫 편을 모은다", () => {
    const posts = [
      createPost("rendering-2", { name: "브라우저 렌더링", order: 2 }),
      createPost("react-1", { name: "React 데이터 흐름", order: 1 }),
      createPost("rendering-1", { name: "브라우저 렌더링", order: 1 }),
      createPost("single"),
    ];

    expect(toSeriesList(posts)).toEqual([
      { name: "브라우저 렌더링", count: 2, firstPostSlug: "rendering-1" },
      { name: "React 데이터 흐름", count: 1, firstPostSlug: "react-1" },
    ]);
  });

  it("시리즈 글이 없으면 빈 배열을 돌려준다", () => {
    expect(toSeriesList([createPost("single")])).toEqual([]);
  });
});

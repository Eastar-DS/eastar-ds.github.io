import { describe, expect, it } from "vitest";

import type { Post } from "@/shared/types/post";

import findPostsBySlugs from ".";

const createPost = (slug: string, title: string): Post => ({
  slug,
  title,
  description: "",
  category: "React",
  publishedAt: new Date("2026-11-21T00:00:00Z"),
  updatedAt: new Date("2026-11-21T00:00:00Z"),
  readingMinutes: 1,
});

const posts = [
  createPost("virtualized-list", "목록 가상화하기"),
  createPost("token-refresh", "토큰 재발급"),
  createPost("render-loop", "화면이 멈추던 문제"),
];

describe("findPostsBySlugs", () => {
  it("적은 순서대로 글을 고른다", () => {
    expect(
      findPostsBySlugs({
        posts,
        slugs: ["render-loop", "virtualized-list"],
      }).map((post) => post.title),
    ).toEqual(["화면이 멈추던 문제", "목록 가상화하기"]);
  });

  it("글 이름이 없으면 빈 목록을 돌려준다", () => {
    expect(findPostsBySlugs({ posts, slugs: [] })).toEqual([]);
  });

  it("없는 글 이름이 있으면 그 이름을 모두 담아 오류를 낸다", () => {
    expect(() =>
      findPostsBySlugs({
        posts,
        slugs: ["virtualized-list", "virtualised-list", "old-post"],
      }),
    ).toThrow("관련 글로 적은 글을 찾을 수 없습니다: virtualised-list, old-post");
  });
});

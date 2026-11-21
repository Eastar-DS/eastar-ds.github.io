import { describe, expect, it } from "vitest";

import type { Post } from "@/shared/types/post";

import createBlogPostingJsonLd from ".";

const post: Post = {
  slug: "browser-layout-and-paint",
  title: "브라우저는 언제 화면을 다시 그릴까",
  description: "요약",
  category: "브라우저",
  publishedAt: new Date("2026-11-18T00:00:00Z"),
  updatedAt: new Date("2026-11-20T00:00:00Z"),
  readingMinutes: 6,
};

describe("createBlogPostingJsonLd", () => {
  it("작성자, 발행일, 수정일, 글 주소를 담는다", () => {
    expect(createBlogPostingJsonLd(post)).toMatchObject({
      "@type": "BlogPosting",
      headline: post.title,
      url: "https://eastar-ds.github.io/posts/browser-layout-and-paint/",
      datePublished: "2026-11-18T00:00:00.000Z",
      dateModified: "2026-11-20T00:00:00.000Z",
      author: { "@type": "Person", name: "이스타" },
    });
  });
});

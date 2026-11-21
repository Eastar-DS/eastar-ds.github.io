import { describe, expect, it } from "vitest";

import type { Post } from "@/shared/types/post";

import createBlogPostingJsonLd from ".";

const post: Post = {
  slug: "virtualized-document-list",
  title: "라이브러리 없이 목록 가상화하기",
  description: "요약",
  category: "브라우저",
  publishedAt: new Date("2026-11-18T00:00:00Z"),
  updatedAt: new Date("2026-11-20T00:00:00Z"),
  readingMinutes: 6,
};

describe("createBlogPostingJsonLd", () => {
  it("작성자(소개 페이지와 같은 Person), 발행일, 수정일(한국 시간), 글 주소, 공유 그림을 담는다", () => {
    expect(createBlogPostingJsonLd(post)).toMatchObject({
      "@type": "BlogPosting",
      headline: post.title,
      url: "https://eastar-ds.github.io/posts/virtualized-document-list/",
      image: "https://eastar-ds.github.io/posts/virtualized-document-list/og.png",
      datePublished: "2026-11-18T09:00:00+09:00",
      dateModified: "2026-11-20T09:00:00+09:00",
      author: {
        "@type": "Person",
        "@id": "https://eastar-ds.github.io/about/#person",
        name: "김동성",
        alternateName: "이스타",
      },
    });
  });
});

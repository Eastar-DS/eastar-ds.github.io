import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * 글 모음입니다. 글 하나는 `src/content/posts/{slug}/index.mdx`이고, 이미지는 같은 폴더에 둡니다.
 * 폴더 이름이 그대로 글 주소(`/posts/{slug}/`)가 됩니다.
 */
const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "*/index.mdx",
    generateId: ({ entry }) => entry.replace(/\/index\.mdx$/, ""),
  }),
  schema: z.object({
    /** 글 제목. 페이지의 h1과 검색 결과 제목이 됩니다 */
    title: z.string(),
    /** 한두 문장 요약. 목록, meta description, RSS에 함께 씁니다 */
    description: z.string(),
    publishedAt: z.coerce.date(),
    /** 내용을 고친 날. 없으면 발행일을 씁니다 */
    updatedAt: z.coerce.date().optional(),
    /** 글 정보 줄 맨 앞에 보이는 주제 하나 */
    category: z.string(),
    series: z
      .object({
        name: z.string(),
        order: z.number().int().positive(),
      })
      .optional(),
  }),
});

export const collections = { posts };

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { CAREER_PROJECT_IDS } from "@/shared/constants/career";
import { POST_CATEGORIES, POST_DESCRIPTION_MAX_LENGTH, POST_TITLE_MAX_LENGTH } from "@/shared/constants/post";

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
    /**
     * 글 제목. 페이지의 h1과 검색 결과 제목이 됩니다.
     * 권장은 25~32자이고(`pnpm check:post`가 경고), 40자를 넘으면 빌드가 멈춥니다(docs/content-guide.md 2.1)
     */
    title: z
      .string()
      .min(1)
      .max(POST_TITLE_MAX_LENGTH, `제목이 ${POST_TITLE_MAX_LENGTH}자를 넘습니다(docs/content-guide.md 2.1)`),
    /**
     * 한두 문장 요약. 목록, meta description, RSS에 함께 씁니다.
     * 권장은 60~80자이고(`pnpm check:post`가 경고), 100자를 넘으면 빌드가 멈춥니다(docs/content-guide.md 2.2)
     */
    description: z
      .string()
      .min(1)
      .max(POST_DESCRIPTION_MAX_LENGTH, `요약이 ${POST_DESCRIPTION_MAX_LENGTH}자를 넘습니다(docs/content-guide.md 2.2)`),
    publishedAt: z.coerce.date(),
    /** 내용을 고친 날. 없으면 발행일을 씁니다 */
    updatedAt: z.coerce.date().optional(),
    /** 글 정보 줄 맨 앞에 보이는 주제 하나. 정한 분류 목록(docs/content-guide.md 8.1) 밖이면 빌드가 멈춥니다 */
    category: z.enum(POST_CATEGORIES),
    series: z
      .object({
        name: z.string(),
        order: z.number().int().positive(),
      })
      .optional(),
    /**
     * 이 글과 이어진 프로젝트 id(`shared/constants/career`의 `knot`, `sellerhome`, `bid`).
     * 적으면 글 끝에 포트폴리오의 그 프로젝트 구획으로 가는 링크가 붙고, 없는 id를 적으면 빌드가 멈춥니다.
     */
    projects: z.array(z.enum(CAREER_PROJECT_IDS)).optional(),
    /**
     * 초안이면 `true`. 배포 빌드에서는 글 목록, 글 페이지, RSS, 사이트맵, llms.txt, 공유 그림 어디에도 나오지 않고,
     * 개발 서버에서만 보입니다. 이스타가 글을 확인한 뒤 지우거나 `false`로 바꿔 게시합니다.
     */
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };

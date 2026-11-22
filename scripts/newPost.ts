/**
 * 새 글의 폴더와 원본을 만듭니다: `src/content/posts/{slug}/index.mdx`.
 *
 * 쓰는 법: `pnpm new-post <slug>` (예: `pnpm new-post browser-rendering-steps`)
 * - 글 이름(slug)이 꼴(영어 소문자 낱말 3~5개를 하이픈으로)에 맞지 않거나 이미 있는 글 이름이면 아무것도 만들지 않고 까닭을 알립니다.
 * - 원본은 앞머리 틀(쓴 날은 오늘 한국 날짜, `draft: true`)과 첫 문단, 「정리」 절 자리만 둡니다. 내용은 docs/content-guide.md를 따라 채웁니다.
 * 바깥 패키지를 쓰지 않아 Node 24로 바로 돌아갑니다.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createPostSource, findSlugProblem, toKoreanDate } from "./newPost/postTemplate.ts";

const POSTS_DIR = path.resolve(import.meta.dirname, "..", "src/content/posts");

const slug = (process.argv[2] ?? "").trim();
const problem = findSlugProblem(slug);

if (problem) {
  console.error(problem);
  process.exit(1);
}

const postDir = path.join(POSTS_DIR, slug);

if (existsSync(postDir)) {
  console.error(`이미 있는 글 이름입니다: src/content/posts/${slug}/. 다른 이름을 고르세요(올린 글의 주소는 바꾸지 않습니다).`);
  process.exit(1);
}

mkdirSync(postDir, { recursive: true });

const file = path.join(postDir, "index.mdx");

writeFileSync(file, createPostSource({ publishedAt: toKoreanDate(new Date()) }));
console.log(`새 글을 만들었습니다: ${path.relative(process.cwd(), file)}`);
console.log(`개발 서버에서 /posts/${slug}/ 로 봅니다. 초안(draft: true)이라 배포 빌드에는 나오지 않습니다.`);

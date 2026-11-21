import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// astro.config.ts가 부르는 코드라 `@/` 별칭과 astro:content를 쓰지 않고 node 모듈만 씁니다(.claude/rules/shared-layer.md)

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---/;

/** 앞머리 한 줄의 값. 끝의 주석(`# 내용을 고쳤을 때만`)과 따옴표를 뗍니다 */
const readField = ({ frontmatter, name }: { frontmatter: string; name: string }) => {
  const line = frontmatter.match(new RegExp(`^${name}:[ \\t]*(.*)$`, "m"))?.[1];
  const value = line?.replace(/\s+#.*$/, "").trim().replace(/^(["'])(.*)\1$/, "$2");

  return value ? value : undefined;
};

const toDate = ({ value, name }: { value: string; name: string }) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`글 앞머리의 ${name}을 날짜로 읽지 못했습니다: ${value} (YYYY-MM-DD로 적습니다)`);
  }

  return date;
};

/**
 * 글 원본(MDX) 한 편의 앞머리에서 사이트맵 lastmod로 쓸 날짜를 읽습니다. 고친 날(`updatedAt`)이 있으면 그 날, 없으면 쓴 날(`publishedAt`)입니다.
 * 날짜만 적은 값(2026-11-21)은 글 스키마(`z.coerce.date()`)와 같이 그날 UTC 0시로 읽습니다. 쓴 날이 없으면 `undefined`입니다.
 */
export const parsePostLastmod = (source: string) => {
  const frontmatter = source.match(FRONTMATTER_PATTERN)?.[1];

  if (!frontmatter) return undefined;

  const updatedAt = readField({ frontmatter, name: "updatedAt" });
  const publishedAt = readField({ frontmatter, name: "publishedAt" });

  if (updatedAt) return toDate({ value: updatedAt, name: "updatedAt" });
  if (publishedAt) return toDate({ value: publishedAt, name: "publishedAt" });

  return undefined;
};

/**
 * 모든 글 폴더(`src/content/posts/{slug}/index.mdx`)의 lastmod를 글 이름(slug)별로 읽습니다(docs/content-guide.md 9장).
 * 사이트맵 통합(`@astrojs/sitemap`)은 콘텐츠 모음을 읽지 못해서, astro.config.ts가 빌드 전에 원본 파일을 직접 읽습니다.
 * 초안도 읽지만, 초안은 배포 빌드에 페이지가 없어 사이트맵에 나오지 않습니다.
 */
const readPostLastmods = (postsDir = path.join(process.cwd(), "src/content/posts")) => {
  const lastmods = new Map<string, Date>();

  if (!existsSync(postsDir)) return lastmods;

  for (const entry of readdirSync(postsDir, { withFileTypes: true })) {
    const file = path.join(postsDir, entry.name, "index.mdx");

    if (!entry.isDirectory() || !existsSync(file)) continue;

    const lastmod = parsePostLastmod(readFileSync(file, "utf8"));

    if (lastmod) lastmods.set(entry.name, lastmod);
  }

  return lastmods;
};

export default readPostLastmods;

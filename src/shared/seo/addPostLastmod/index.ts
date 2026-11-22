import type { SitemapItem } from "@astrojs/sitemap";

// astro.config.ts가 부르는 코드라 `@/` 별칭을 쓰지 않습니다(.claude/rules/shared-layer.md)

/** 글 주소 꼴. `shared/routes/paths`의 `getPostPath`(`/posts/{slug}/`)와 같게 맞춥니다 */
const POST_PATH_PATTERN = /^\/posts\/([^/]+)\/$/;

interface AddPostLastmodParams {
  item: SitemapItem;
  /** 글 이름(slug)별 lastmod. `shared/content/readPostLastmods`로 읽습니다 */
  lastmods: ReadonlyMap<string, Date>;
}

/**
 * 사이트맵 항목이 글 주소면 그 글의 lastmod(고친 날, 없으면 쓴 날)를 붙입니다. `@astrojs/sitemap`의 `serialize`에서 씁니다.
 * 글이 아닌 페이지(첫 화면, 소개 등)에는 붙이지 않습니다. 빌드한 시각을 넣으면 검색 엔진이 lastmod를 믿지 않게 되기 때문입니다.
 */
const addPostLastmod = ({ item, lastmods }: AddPostLastmodParams) => {
  const slug = new URL(item.url).pathname.match(POST_PATH_PATTERN)?.[1];
  const lastmod = slug === undefined ? undefined : lastmods.get(decodeURIComponent(slug));

  return lastmod ? { ...item, lastmod: lastmod.toISOString() } : item;
};

export default addPostLastmod;

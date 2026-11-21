/** 고정된 페이지 주소. 주소 끝의 / 는 astro.config의 trailingSlash: "always"와 맞춥니다 */
export const PATHS = {
  home: "/",
  about: "/about/",
  privacy: "/privacy/",
  rss: "/rss.xml",
} as const;

/** 페이지마다 하나인 `<main>`의 id. 건너뛰기 링크가 이 자리로 옮겨 줍니다 */
export const MAIN_CONTENT_ID = "main";

/** 글 목록 페이지에서 시리즈 칩 구획의 id. 머리말의 「시리즈」 링크가 이 자리로 갑니다 */
export const SERIES_SECTION_ID = "series";

/** 글 주소를 만듭니다. 다른 저장소의 Pages 주소와 겹치지 않게 /posts/ 아래에 둡니다 */
export const getPostPath = (slug: string) => `/posts/${slug}/`;

/** 머리말의 주 메뉴 */
export const NAV_ITEMS = [
  { label: "글", href: PATHS.home },
  { label: "시리즈", href: `${PATHS.home}#${SERIES_SECTION_ID}` },
  { label: "소개", href: PATHS.about },
] as const;

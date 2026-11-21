/** 고정된 페이지 주소. 주소 끝의 / 는 astro.config의 trailingSlash: "always"와 맞춥니다 */
export const PATHS = {
  home: "/",
  about: "/about/",
  /** 공개 스위치(`IS_RESUME_PUBLIC`)가 꺼져 있으면 배포 빌드에 없는 주소입니다 */
  resume: "/resume/",
  /** 공개 스위치(`IS_RESUME_PUBLIC`)가 꺼져 있으면 배포 빌드에 없는 주소입니다 */
  portfolio: "/portfolio/",
  privacy: "/privacy/",
  rss: "/rss.xml",
  sitemap: "/sitemap-index.xml",
  /** AI 에이전트가 읽는 사이트 안내 (https://llmstxt.org) */
  llms: "/llms.txt",
} as const;

/** 페이지마다 하나인 `<main>`의 id. 건너뛰기 링크가 이 자리로 옮겨 줍니다 */
export const MAIN_CONTENT_ID = "main";

/** 글 목록 페이지에서 시리즈 칩 구획의 id. 머리말의 「시리즈」 링크가 이 자리로 갑니다 */
export const SERIES_SECTION_ID = "series";

/** 글 주소를 만듭니다. 다른 저장소의 Pages 주소와 겹치지 않게 /posts/ 아래에 둡니다 */
export const getPostPath = (slug: string) => `/posts/${slug}/`;

/**
 * 페이지의 공유 미리보기 그림 주소를 만듭니다. 그림은 페이지 주소 바로 아래 `og.png`에 둡니다.
 * 예: `/posts/글-이름/` → `/posts/글-이름/og.png`, 첫 화면 `/` → `/og.png`(사이트 기본 그림)
 */
export const getOgImagePath = (pagePath: string) => `${pagePath}og.png`;

/** 머리말의 주 메뉴 가운데 늘 보이는 것 */
export const NAV_ITEMS = [
  { label: "글", href: PATHS.home },
  { label: "시리즈", href: `${PATHS.home}#${SERIES_SECTION_ID}` },
  { label: "소개", href: PATHS.about },
] as const;

/** 이력서 · 포트폴리오 메뉴. 두 페이지를 그릴 때만 주 메뉴 뒤에 붙입니다 */
export const RESUME_NAV_ITEMS = [
  { label: "이력서", href: PATHS.resume },
  { label: "포트폴리오", href: PATHS.portfolio },
] as const;

interface GetNavItemsParams {
  /** 이력서 · 포트폴리오 페이지를 그리는지 (`shared/constants/features`의 `IS_RESUME_SHOWN`) */
  isResumeShown: boolean;
}

/** 머리말의 주 메뉴를 만듭니다. 이력서 · 포트폴리오는 페이지를 그릴 때만 넣어서, 없는 주소로 가는 메뉴가 생기지 않게 합니다 */
export const getNavItems = ({ isResumeShown }: GetNavItemsParams) =>
  isResumeShown ? [...NAV_ITEMS, ...RESUME_NAV_ITEMS] : [...NAV_ITEMS];

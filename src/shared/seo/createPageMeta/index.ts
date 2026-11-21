import { IS_PORTFOLIO_SHOWN, IS_RESUME_SHOWN } from "@/shared/constants/features";
import { SITE } from "@/shared/constants/site";
import getOgImage from "@/shared/seo/getOgImage";
import getPageOgCards from "@/shared/seo/getPageOgCards";
import type { PageMeta } from "@/shared/types/seo";

interface CreatePageMetaParams {
  /** 페이지 제목. 없으면 사이트 이름만 씁니다 */
  title?: string;
  description?: string;
  /** 사이트 안의 주소. 예: `/posts/글-이름/` */
  path: string;
  ogType?: PageMeta["ogType"];
  publishedAt?: Date;
  updatedAt?: Date;
}

/**
 * `Document`에 넘길 메타 정보(title, description, canonical, og, twitter)를 만듭니다.
 * - `<title>`은 「페이지 제목 · 사이트 이름」, og:title은 페이지 제목만 씁니다(docs/content-guide.md 2.1). 사이트 이름은 og:site_name이 알립니다.
 * - 공유 미리보기 그림은 `getOgImage`가 고릅니다. 글은 글마다 만든 그림, 나머지는 페이지 그림이나 사이트 기본 그림입니다.
 */
const createPageMeta = ({
  title,
  description = SITE.description,
  path,
  ogType = "website",
  publishedAt,
  updatedAt,
}: CreatePageMetaParams) => {
  const meta: PageMeta = {
    title: title ? `${title} · ${SITE.title}` : SITE.title,
    ogTitle: title ?? SITE.title,
    description,
    canonicalUrl: new URL(path, SITE.url).href,
    siteName: SITE.title,
    locale: SITE.locale,
    ogType,
    image: getOgImage({
      path,
      title,
      ogType,
      pageCards: getPageOgCards({
        isResumeShown: IS_RESUME_SHOWN,
        isPortfolioShown: IS_PORTFOLIO_SHOWN,
      }),
    }),
    publishedTime: publishedAt?.toISOString(),
    modifiedTime: updatedAt?.toISOString(),
  };

  return meta;
};

export default createPageMeta;

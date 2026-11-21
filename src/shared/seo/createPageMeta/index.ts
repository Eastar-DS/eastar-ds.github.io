import { SITE } from "@/shared/constants/site";
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

/** `Document`에 넘길 메타 정보(title, description, canonical, og)를 만듭니다 */
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
    description,
    canonicalUrl: new URL(path, SITE.url).href,
    siteName: SITE.title,
    locale: SITE.locale,
    ogType,
    publishedTime: publishedAt?.toISOString(),
    modifiedTime: updatedAt?.toISOString(),
  };

  return meta;
};

export default createPageMeta;

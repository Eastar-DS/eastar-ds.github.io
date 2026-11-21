/** `Document`가 `<head>`에 그리는 메타 정보. `shared/seo/createPageMeta`로 만듭니다 */
export interface PageMeta {
  /** 사이트 이름까지 붙은 문서 제목 */
  title: string;
  /** 공유 카드의 제목(og:title, twitter:title). 사이트 이름은 og:site_name이 알리므로 붙이지 않습니다 */
  ogTitle: string;
  description: string;
  /** canonical과 og:url에 쓰는 절대 주소. 주소가 정해지지 않는 페이지(404)는 비웁니다 */
  canonicalUrl?: string;
  siteName: string;
  locale: string;
  ogType: "website" | "article";
  image: OgImage;
  /** ISO 8601, 한국 시간(+09:00). 글 화면에서만 씁니다 */
  publishedTime?: string;
  modifiedTime?: string;
}

/** 페이지의 공유 미리보기 그림(og:image, twitter:image) */
export interface OgImage {
  /** 절대 주소 */
  url: string;
  /** 그림이 무엇인지 (og:image:alt, twitter:image:alt) */
  alt: string;
  width: number;
  height: number;
  type: string;
}

/** 공유 미리보기 그림에 그리는 글. `shared/seo/createOgImage`가 이 값으로 1200×630 PNG를 만듭니다 */
export interface OgCard {
  /** 제목 위의 작은 강조색 글 (글의 분류 등) */
  label?: string;
  title: string;
  /** 제목 아래 보조색 글. 사이트 기본 그림에서 사이트 설명을 보일 때 씁니다 */
  description?: string;
}

/** 자기 공유 그림을 갖는 글 아닌 페이지 하나 */
export interface PageOgCard {
  /** 페이지 주소. 그림은 그 바로 아래 `og.png`에 생깁니다 */
  path: string;
  alt: string;
  card: OgCard;
}

/** `<script type="application/ld+json">`에 넣는 구조화 데이터 하나 */
export type JsonLd = Record<string, unknown>;

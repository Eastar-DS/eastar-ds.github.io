/** `Document`가 `<head>`에 그리는 메타 정보. `shared/seo/createPageMeta`로 만듭니다 */
export interface PageMeta {
  /** 사이트 이름까지 붙은 문서 제목 */
  title: string;
  description: string;
  canonicalUrl: string;
  siteName: string;
  locale: string;
  ogType: "website" | "article";
  /** ISO 8601. 글 화면에서만 씁니다 */
  publishedTime?: string;
  modifiedTime?: string;
}

/** `<script type="application/ld+json">`에 넣는 구조화 데이터 하나 */
export type JsonLd = Record<string, unknown>;

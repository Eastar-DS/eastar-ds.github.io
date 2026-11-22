import { SITE } from "@/shared/constants/site";
import { PATHS } from "@/shared/routes/paths";
import type { JsonLd } from "@/shared/types/seo";

/**
 * 첫 화면에만 두는 WebSite 구조화 데이터를 만듭니다. Google이 검색 결과에 보일 사이트 이름(「이스타의 개발 노트」)을 고를 때 읽습니다.
 * Google 문서(Site names)대로 첫 화면에 하나만 두고, url은 첫 화면의 canonical 주소와 같게 씁니다.
 * alternateName은 이스타가 정한 다른 이름이 없어 넣지 않습니다.
 * @see https://developers.google.com/search/docs/appearance/site-names
 */
const createWebSiteJsonLd = () => {
  const url = new URL(PATHS.home, SITE.url).href;
  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}#website`,
    name: SITE.title,
    url,
    description: SITE.description,
    inLanguage: SITE.language,
  };

  return jsonLd;
};

export default createWebSiteJsonLd;

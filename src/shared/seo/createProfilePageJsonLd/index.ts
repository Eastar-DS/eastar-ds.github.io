import { SITE } from "@/shared/constants/site";
import { PATHS } from "@/shared/routes/paths";
import createPersonJsonLd from "@/shared/seo/createPersonJsonLd";
import type { JsonLd } from "@/shared/types/seo";

/** 소개 페이지의 ProfilePage 구조화 데이터를 만듭니다. 페이지가 소개하는 사람(mainEntity)은 글쓴이 Person입니다 */
const createProfilePageJsonLd = () => {
  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: new URL(PATHS.about, SITE.url).href,
    inLanguage: SITE.language,
    mainEntity: createPersonJsonLd(),
  };

  return jsonLd;
};

export default createProfilePageJsonLd;

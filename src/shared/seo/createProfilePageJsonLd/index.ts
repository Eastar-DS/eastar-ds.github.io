import { SITE } from "@/shared/constants/site";
import { PATHS } from "@/shared/routes/paths";
import createPersonJsonLd from "@/shared/seo/createPersonJsonLd";
import type { JsonLd } from "@/shared/types/seo";
import formatDate from "@/shared/utils/formatDate";

/**
 * 소개 페이지의 ProfilePage 구조화 데이터를 만듭니다. 페이지가 소개하는 사람(mainEntity)은 글쓴이 Person입니다.
 * dateModified는 소개 내용을 사람이 마지막으로 고친 날(`SITE.author.profileUpdatedAt`)을 한국 달력 날짜의 0시(+09:00)로 적습니다.
 * 빌드한 날을 넣지 않는 까닭은, Google이 이 값을 「사람이 프로필을 고친 날」로 읽기 때문입니다.
 */
const createProfilePageJsonLd = () => {
  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: new URL(PATHS.about, SITE.url).href,
    inLanguage: SITE.language,
    dateModified: formatDate({ date: new Date(SITE.author.profileUpdatedAt), format: "isoDateTime" }),
    mainEntity: createPersonJsonLd(),
  };

  return jsonLd;
};

export default createProfilePageJsonLd;

import { SITE } from "@/shared/constants/site";
import { PATHS } from "@/shared/routes/paths";
import type { JsonLd } from "@/shared/types/seo";

/**
 * 글쓴이 이스타의 Person 구조화 데이터를 만듭니다. 소개 페이지(ProfilePage)와 글(BlogPosting의 author)이 같은 값을 씁니다.
 * `@id`를 소개 페이지 주소에 붙여, 검색 엔진이 두 곳의 Person을 한 사람으로 묶게 합니다.
 * 안에 넣는 값이라 `@context`는 감싸는 쪽이 붙입니다.
 */
const createPersonJsonLd = () => {
  const aboutUrl = new URL(PATHS.about, SITE.url).href;
  const jsonLd: JsonLd = {
    "@type": "Person",
    "@id": `${aboutUrl}#person`,
    name: SITE.author.name,
    url: aboutUrl,
    sameAs: [SITE.author.githubUrl],
  };

  return jsonLd;
};

export default createPersonJsonLd;

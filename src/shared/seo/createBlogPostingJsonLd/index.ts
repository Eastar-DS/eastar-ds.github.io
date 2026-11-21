import { SITE } from "@/shared/constants/site";
import { getOgImagePath, getPostPath } from "@/shared/routes/paths";
import createPersonJsonLd from "@/shared/seo/createPersonJsonLd";
import type { Post } from "@/shared/types/post";
import type { JsonLd } from "@/shared/types/seo";
import formatDate from "@/shared/utils/formatDate";

/**
 * 글 한 편의 BlogPosting 구조화 데이터를 만듭니다. 작성자, 발행일, 수정일, 공유 미리보기 그림을 담습니다.
 * 날짜는 시간대를 밝혀야 Google이 제 시간대로 읽어서, 한국 시간(+09:00)으로 적습니다.
 */
const createBlogPostingJsonLd = (post: Post) => {
  const path = getPostPath(post.slug);
  const url = new URL(path, SITE.url).href;
  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: new URL(getOgImagePath(path), SITE.url).href,
    datePublished: formatDate({ date: post.publishedAt, format: "isoDateTime" }),
    dateModified: formatDate({ date: post.updatedAt, format: "isoDateTime" }),
    inLanguage: SITE.language,
    articleSection: post.category,
    author: createPersonJsonLd(),
  };

  return jsonLd;
};

export default createBlogPostingJsonLd;

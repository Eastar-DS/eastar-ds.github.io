import { SITE } from "@/shared/constants/site";
import { getOgImagePath, getPostPath } from "@/shared/routes/paths";
import createPersonJsonLd from "@/shared/seo/createPersonJsonLd";
import type { Post } from "@/shared/types/post";
import type { JsonLd } from "@/shared/types/seo";

/** 글 한 편의 BlogPosting 구조화 데이터를 만듭니다. 작성자, 발행일, 수정일, 공유 미리보기 그림을 담습니다 */
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
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: SITE.language,
    articleSection: post.category,
    author: createPersonJsonLd(),
  };

  return jsonLd;
};

export default createBlogPostingJsonLd;

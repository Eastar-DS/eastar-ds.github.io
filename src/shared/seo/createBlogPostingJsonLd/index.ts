import { SITE } from "@/shared/constants/site";
import { getPostPath, PATHS } from "@/shared/routes/paths";
import type { Post } from "@/shared/types/post";
import type { JsonLd } from "@/shared/types/seo";

/** 글 한 편의 BlogPosting 구조화 데이터를 만듭니다. 작성자, 발행일, 수정일을 담습니다 */
const createBlogPostingJsonLd = (post: Post) => {
  const url = new URL(getPostPath(post.slug), SITE.url).href;
  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: SITE.language,
    articleSection: post.category,
    author: {
      "@type": "Person",
      name: SITE.author.name,
      url: new URL(PATHS.about, SITE.url).href,
      sameAs: [SITE.author.githubUrl],
    },
  };

  return jsonLd;
};

export default createBlogPostingJsonLd;

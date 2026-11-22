// 글들의 본문에서 바깥 링크(이 사이트 밖 http · https 주소)를 모으는 순수 함수입니다.
// 코드 칸과 인라인 코드 속 주소는 링크가 아니므로 parseMdx가 이미 뺍니다.
import { SITE } from "../../src/shared/constants/site/index.ts";
import type { SourcePost } from "../checkPost/readSourcePost.ts";

export interface ExternalLink {
  url: string;
  /** 이 주소가 나오는 곳. 예: `virtualized-document-list:46` */
  places: string[];
}

/** 주소마다 한 번만 모으고, 나오는 글과 줄을 함께 적습니다 */
const collectExternalLinks = (posts: Pick<SourcePost, "slug" | "document">[]) => {
  const links = new Map<string, string[]>();

  posts.forEach((post) => {
    post.document.links
      .filter((link) => /^https?:\/\//.test(link.href) && !link.href.startsWith(SITE.url))
      .forEach((link) => {
        links.set(link.href, [...(links.get(link.href) ?? []), `${post.slug}:${link.line}`]);
      });
  });

  return [...links].map(([url, places]) => {
    const link: ExternalLink = { url, places };

    return link;
  });
};

export default collectExternalLinks;

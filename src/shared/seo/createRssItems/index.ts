import { getPostPath } from "@/shared/routes/paths";
import type { Post } from "@/shared/types/post";

interface CreateRssItemsParams {
  posts: Post[];
  /** 글 이름(slug)별 본문 HTML(content:encoded). `shared/seo/renderRssContents`로 만듭니다. 없는 글은 요약만 싣습니다 */
  contents?: ReadonlyMap<string, string>;
}

/**
 * 글 목록을 RSS 항목으로 바꿉니다. `@astrojs/rss`의 items에 그대로 넘깁니다.
 * description에는 요약을, content에는 본문 전체를 넣습니다(네이버 서치어드바이저는 본문 전체를 권함).
 */
const createRssItems = ({ posts, contents }: CreateRssItemsParams) =>
  posts.map((post) => ({
    title: post.title,
    description: post.description,
    pubDate: post.publishedAt,
    link: getPostPath(post.slug),
    categories: [post.category],
    content: contents?.get(post.slug),
  }));

export default createRssItems;

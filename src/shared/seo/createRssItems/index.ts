import { getPostPath } from "@/shared/routes/paths";
import type { Post } from "@/shared/types/post";

/** 글 목록을 RSS 항목으로 바꿉니다. `@astrojs/rss`의 items에 그대로 넘깁니다 */
const createRssItems = (posts: Post[]) =>
  posts.map((post) => ({
    title: post.title,
    description: post.description,
    pubDate: post.publishedAt,
    link: getPostPath(post.slug),
    categories: [post.category],
  }));

export default createRssItems;

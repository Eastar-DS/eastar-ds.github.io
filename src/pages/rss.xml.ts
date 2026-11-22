import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import PostBody from "@/modules/widgets/post/PostBody/index.astro";
import { SITE } from "@/shared/constants/site";
import getPosts from "@/shared/content/getPosts";
import createRssChannel from "@/shared/seo/createRssChannel";
import createRssItems from "@/shared/seo/createRssItems";
import renderRssContents from "@/shared/seo/renderRssContents";

/** RSS 피드(/rss.xml). 글마다 요약과 본문 전체를 싣습니다. 본문은 글 페이지와 같은 `PostBody`로 그립니다 */
export const GET = async (context: APIContext) => {
  const posts = await getPosts();
  const contents = await renderRssContents({ posts, body: PostBody });

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: createRssItems({ posts, contents }),
    ...createRssChannel(),
  });
};

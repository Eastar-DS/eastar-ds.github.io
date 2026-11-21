import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { SITE } from "@/shared/constants/site";
import getPosts from "@/shared/content/getPosts";
import createRssItems from "@/shared/seo/createRssItems";

/** RSS 피드(/rss.xml) */
export const GET = async (context: APIContext) =>
  rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: createRssItems(await getPosts()),
    customData: `<language>${SITE.language}</language>`,
  });

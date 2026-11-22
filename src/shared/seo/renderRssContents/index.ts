import { getContainerRenderer as getMdxContainerRenderer } from "@astrojs/mdx/container-renderer";
import { getContainerRenderer as getReactContainerRenderer } from "@astrojs/react/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";

import { SITE } from "@/shared/constants/site";
import { getPostPath } from "@/shared/routes/paths";
import toFeedHtml from "@/shared/seo/toFeedHtml";
import type { Post } from "@/shared/types/post";

type AstroComponent = Parameters<AstroContainer["renderToString"]>[0];

interface RenderRssContentsParams {
  posts: Post[];
  /** 글 본문을 그리는 부품. 글 페이지와 같은 본문 모양을 쓰려고 페이지가 `PostBody`를 넘깁니다(shared는 modules를 import하지 않음) */
  body: AstroComponent;
}

/**
 * RSS의 글 본문 전체(content:encoded)를 글 이름(slug)별로 만듭니다.
 * 글 페이지의 본문 부품을 Astro Container API로 그린 뒤, `toFeedHtml`이 RSS 리더에 맞게 다듬습니다(데모 · 도식은 안내 글로 바꿈).
 * Container API는 실험 기능이라 Astro를 올릴 때 RSS 본문을 다시 확인합니다.
 * MDX 본문(`astro:jsx`)과 글 속 React 데모를 그리려고 두 렌더러를 붙입니다.
 */
const renderRssContents = async ({ posts, body }: RenderRssContentsParams) => {
  const renderers = await loadRenderers([getMdxContainerRenderer(), getReactContainerRenderer()]);
  const container = await AstroContainer.create({ renderers });
  const contents = new Map<string, string>();

  for (const post of posts) {
    const html = await container.renderToString(body, { props: { slug: post.slug } });

    contents.set(post.slug, toFeedHtml({ html, postUrl: new URL(getPostPath(post.slug), SITE.url).href }));
  }

  return contents;
};

export default renderRssContents;

import type { APIContext, GetStaticPaths, InferGetStaticPropsType } from "astro";

import { IS_PORTFOLIO_SHOWN, IS_RESUME_SHOWN } from "@/shared/constants/features";
import { OG_IMAGE } from "@/shared/constants/ogImage";
import createOgImage from "@/shared/seo/createOgImage";
import getPageOgCards from "@/shared/seo/getPageOgCards";

/**
 * 글이 아닌 페이지의 공유 미리보기 그림. 사이트 기본 그림(/og.png)과, 페이지가 있을 때만 이력서(/resume/og.png) · 포트폴리오(/portfolio/og.png) 그림을 만듭니다.
 * 어떤 페이지가 자기 그림을 갖는지는 `getPageOgCards` 한곳에서 정하고, 메타(`createPageMeta`)도 같은 목록을 봅니다.
 */
export const getStaticPaths = (() =>
  getPageOgCards({ isResumeShown: IS_RESUME_SHOWN, isPortfolioShown: IS_PORTFOLIO_SHOWN }).map(
    ({ path, card }) => ({
      // 첫 화면(/)은 page가 비어 /og.png, /resume/은 page가 resume이라 /resume/og.png가 됩니다
      params: { page: path.replace(/^\/|\/$/g, "") || undefined },
      props: { card },
    }),
  )) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET = async ({ props }: APIContext<Props>) =>
  new Response(await createOgImage(props.card), {
    headers: { "Content-Type": OG_IMAGE.type },
  });

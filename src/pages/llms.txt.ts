import { IS_PORTFOLIO_SHOWN, IS_RESUME_SHOWN } from "@/shared/constants/features";
import getPosts from "@/shared/content/getPosts";
import createLlmsTxt from "@/shared/seo/createLlmsTxt";

/** llms.txt(/llms.txt): AI 에이전트가 읽는 사이트 안내와 글 목록 (https://llmstxt.org) */
export const GET = async () =>
  new Response(
    createLlmsTxt({
      posts: await getPosts(),
      isResumeShown: IS_RESUME_SHOWN,
      isPortfolioShown: IS_PORTFOLIO_SHOWN,
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );

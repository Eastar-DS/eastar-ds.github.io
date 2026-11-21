import createRobotsTxt from "@/shared/seo/createRobotsTxt";

/** robots.txt: 모든 로봇 허용과 사이트맵 주소 */
export const GET = () =>
  new Response(createRobotsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

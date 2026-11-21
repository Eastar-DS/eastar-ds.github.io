import { SITE } from "@/shared/constants/site";

/**
 * 이름을 따로 적어 허용하는 로봇. `User-agent: *`도 모두 허용하지만, AEO(AI 답변에 인용되기)가 목표라
 * AI 검색 · 수집 로봇을 막지 않는다는 뜻을 분명히 적어 둡니다. 이유는 docs/plan.md 「SEO와 AEO」에 있습니다.
 */
export const ALLOWED_BOTS = [
  // 검색
  "Googlebot",
  "Bingbot",
  "Yeti", // 네이버
  "Daumoa", // 다음
  "Applebot",
  "DuckDuckBot",
  // AI 검색 · 답변 (사용자 질문에 답할 때 글을 읽고 출처로 걸어 줌)
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  // AI 학습 · 수집
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
] as const;

/** robots.txt 내용을 만듭니다. 모든 로봇에 모든 주소를 허용하고 사이트맵 주소를 알립니다 */
const createRobotsTxt = () =>
  [
    "User-agent: *",
    "Allow: /",
    "",
    ...ALLOWED_BOTS.map((bot) => `User-agent: ${bot}`),
    "Allow: /",
    "",
    `Sitemap: ${new URL("/sitemap-index.xml", SITE.url).href}`,
    "",
  ].join("\n");

export default createRobotsTxt;

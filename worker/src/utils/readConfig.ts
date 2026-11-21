import type { ModerationMode } from "../types/comment";
import type { Env } from "../types/env";

// 저장 시간을 잘못 적었을 때 쓰는 값과 범위
const DEFAULT_CACHE_TTL_SECONDS = 60;
const MIN_CACHE_TTL_SECONDS = 10;
const MAX_CACHE_TTL_SECONDS = 600;

/** wrangler.jsonc의 vars(모두 문자열)를 Worker가 쓰는 값으로 바꿉니다. 잘못 적은 값은 안전한 기본값으로 둡니다 */
const readConfig = (env: Env) => {
  const ttl = Number(env.COMMENTS_CACHE_TTL_SECONDS);
  const moderation: ModerationMode = env.COMMENT_MODERATION === "approval" ? "approval" : "immediate";

  return {
    moderation,
    cacheTtlSeconds: Number.isFinite(ttl)
      ? Math.min(Math.max(Math.round(ttl), MIN_CACHE_TTL_SECONDS), MAX_CACHE_TTL_SECONDS)
      : DEFAULT_CACHE_TTL_SECONDS,
    turnstileExpectedHostnames: (env.TURNSTILE_EXPECTED_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
    posthogRegion: env.POSTHOG_REGION === "eu" ? ("eu" as const) : ("us" as const),
    isCommentsConfigured: Boolean(env.NOTION_TOKEN && env.NOTION_DATA_SOURCE_ID && env.TURNSTILE_SECRET_KEY),
  };
};

export default readConfig;

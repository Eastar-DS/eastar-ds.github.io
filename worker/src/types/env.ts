/**
 * Worker가 받는 설정과 바인딩입니다. 이름은 wrangler.jsonc의 vars · ratelimits와 같아야 합니다.
 */
export interface Env {
  /** 노션 내부 통합 토큰. 비밀값(`wrangler secret put NOTION_TOKEN`) */
  NOTION_TOKEN: string;
  /** Turnstile 비밀 키. 비밀값(`wrangler secret put TURNSTILE_SECRET_KEY`) */
  TURNSTILE_SECRET_KEY: string;
  /** 노션 댓글 표의 데이터 소스 id */
  NOTION_DATA_SOURCE_ID: string;
  /** `immediate`(바로 보임) 또는 `approval`(승인 뒤 보임) */
  COMMENT_MODERATION: string;
  /** 댓글 목록을 저장해 두는 시간(초) */
  COMMENTS_CACHE_TTL_SECONDS: string;
  /** Turnstile 검증 결과에서 받아들일 hostname 목록(쉼표로 나눔). 비우면 검사하지 않음 */
  TURNSTILE_EXPECTED_HOSTNAMES: string;
  /** PostHog 프로젝트 지역. `us` 또는 `eu` */
  POSTHOG_REGION: string;
  /** 로컬 개발에서 가짜 노션 서버로 보낼 때만 .dev.vars에 넣습니다. 배포에서는 비워 둡니다 */
  NOTION_API_BASE?: string;
  /** 댓글 쓰기 빈도 제한 */
  COMMENT_RATE_LIMITER: RateLimit;
}

type WorkerEnv = Env;

declare global {
  namespace Cloudflare {
    // vitest의 `cloudflare:test`가 주는 env의 타입을 이 Env로 맞춥니다
    interface Env extends WorkerEnv {}
  }
}

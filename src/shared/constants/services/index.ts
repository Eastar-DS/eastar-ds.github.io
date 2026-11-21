/**
 * 바깥 서비스(Cloudflare Worker · Turnstile · PostHog) 설정입니다. 이스타가 2차 배포 때 채웁니다(docs/deploy-phase2.md).
 * 값이 비어 있으면 그 기능의 코드를 페이지에 싣지 않습니다.
 * - 댓글: IS_COMMENTS_ENABLED(shared/constants/features)가 켜져 있고 WORKER_URL · TURNSTILE_SITE_KEY가 모두 있을 때만 그립니다.
 * - 방문 통계: WORKER_URL · POSTHOG_PROJECT_KEY가 모두 있을 때만 불러옵니다.
 * 여기에 넣는 값은 모두 브라우저에 공개되는 값입니다. 비밀값(노션 토큰, Turnstile 비밀 키)은 Worker 비밀값에만 둡니다.
 */

/** Cloudflare Worker 주소. 끝에 / 를 붙이지 않습니다. 예: https://eastar-blog.<계정 하위 도메인>.workers.dev */
export const WORKER_URL = "";

/** Turnstile 위젯의 사이트 키(공개 값) */
export const TURNSTILE_SITE_KEY = "";

/** PostHog 프로젝트 키(공개 값, phc_로 시작) */
export const POSTHOG_PROJECT_KEY = "";

/** PostHog 중계 경로. Worker의 RELAY_PATH_PREFIX(worker/src/constants/relay.ts)와 같은 값이어야 합니다 */
export const POSTHOG_RELAY_PATH = "/bridge";

/** PostHog 화면 주소(도구 모음 링크용). 프로젝트를 EU에 만들었으면 https://eu.posthog.com 으로 바꿉니다 */
export const POSTHOG_UI_HOST = "https://us.posthog.com";

/**
 * 세션 리플레이를 녹화할 방문(세션)의 비율. 0이면 녹화하지 않고, 1이면 모두 녹화합니다.
 * 세션 id로 정하므로 한 세션은 통째로 녹화되거나 통째로 빠집니다. PostHog 쪽 표본 설정은 100%로 둡니다(docs/deploy-phase2.md).
 */
export const SESSION_REPLAY_SAMPLE_RATE = 0.1;

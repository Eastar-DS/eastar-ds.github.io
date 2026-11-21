/**
 * PostHog 중계 경로입니다 (PostHog 공식 문서 「Cloudflare reverse proxy」 방식).
 *
 * 블로그의 PostHog `api_host`는 `<Worker 주소>/<RELAY_PATH_PREFIX>`입니다.
 * 블로그 상수(src/shared/constants/services의 POSTHOG_RELAY_PATH)와 같은 값이어야 합니다.
 * 광고 차단 목록에 걸리기 쉬운 이름(analytics, tracking, telemetry, posthog, ph, ingest)을 피해 뜻 없는 낱말을 씁니다.
 */
export const RELAY_PATH_PREFIX = "/bridge";

/** 이 접두어로 시작하는 경로는 정적 파일(SDK, 녹화 도구)이라 정적 파일 서버로 넘기고 Worker가 저장해 둡니다 */
export const RELAY_ASSET_PATH_PATTERN = /^\/(static|array)\//;

export const POSTHOG_HOSTS = {
  us: { api: "us.i.posthog.com", asset: "us-assets.i.posthog.com" },
  eu: { api: "eu.i.posthog.com", asset: "eu-assets.i.posthog.com" },
} as const;

/** PostHog 프로젝트 키(공개 키 phc_ 등)만 Authorization으로 넘기고 나머지는 지웁니다 */
export const POSTHOG_PUBLIC_AUTHORIZATION_PATTERN = /^Bearer ph[csx]_/;

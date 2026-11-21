interface CreatePosthogConfigParams {
  /** WORKER_URL */
  workerUrl: string;
  /** POSTHOG_RELAY_PATH (Worker의 중계 경로) */
  relayPath: string;
  /** POSTHOG_UI_HOST */
  uiHost: string;
}

/** PostHog를 부르는 주소(Worker 중계 주소). SDK도 `${이 주소}/static/array.js`에서 받습니다 */
export const toRelayHost = ({ workerUrl, relayPath }: Pick<CreatePosthogConfigParams, "workerUrl" | "relayPath">) =>
  `${workerUrl.replace(/\/+$/, "")}/${relayPath.replace(/^\/+|\/+$/g, "")}`;

/**
 * posthog.init에 넘길 설정입니다 (PostHog JS 문서 「Config」, 2026-11-21 기준).
 * - 모든 요청은 Worker 중계 주소로 보냅니다. 광고 차단기에 덜 걸리고, PostHog 주소가 페이지에 드러나지 않습니다.
 * - 쿠키 없이 localStorage에만 방문자 표시를 둡니다.
 * - 세션 리플레이는 처음에 끄고, 표본으로 뽑힌 세션만 켭니다(AnalyticsScript). 녹화할 때 입력 칸은 모두 가립니다.
 */
const createPosthogConfig = ({ workerUrl, relayPath, uiHost }: CreatePosthogConfigParams) => ({
  api_host: toRelayHost({ workerUrl, relayPath }),
  ui_host: uiHost,
  defaults: "2026-08-30",
  person_profiles: "identified_only",
  persistence: "localStorage",
  respect_dnt: true,
  disable_session_recording: true,
  session_recording: {
    maskAllInputs: true,
  },
});

export default createPosthogConfig;

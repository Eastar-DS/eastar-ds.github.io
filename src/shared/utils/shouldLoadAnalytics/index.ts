interface ShouldLoadAnalyticsParams {
  /** WORKER_URL (shared/constants/services) */
  workerUrl: string;
  /** POSTHOG_PROJECT_KEY (shared/constants/services) */
  projectKey: string;
}

/** 방문 통계(PostHog)를 불러올지 정합니다. 중계할 Worker 주소와 프로젝트 키가 모두 있어야 불러옵니다 */
const shouldLoadAnalytics = ({ workerUrl, projectKey }: ShouldLoadAnalyticsParams) =>
  workerUrl.trim().length > 0 && projectKey.trim().length > 0;

export default shouldLoadAnalytics;

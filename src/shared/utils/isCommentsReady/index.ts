interface IsCommentsReadyParams {
  /** IS_COMMENTS_ENABLED (shared/constants/features) */
  isEnabled: boolean;
  /** WORKER_URL (shared/constants/services) */
  workerUrl: string;
  /** TURNSTILE_SITE_KEY (shared/constants/services) */
  turnstileSiteKey: string;
}

/** 댓글 칸을 그릴지 정합니다. 켜져 있고 Worker 주소와 Turnstile 사이트 키가 모두 있어야 그립니다 */
const isCommentsReady = ({ isEnabled, workerUrl, turnstileSiteKey }: IsCommentsReadyParams) =>
  isEnabled && workerUrl.trim().length > 0 && turnstileSiteKey.trim().length > 0;

export default isCommentsReady;

/**
 * 기능 켜고 끄기. 배포를 나눠 하므로, 준비되지 않은 기능은 여기서 끕니다.
 */

/**
 * 댓글(노션 DB 익명 댓글, docs/plan.md 「댓글」). Cloudflare Worker를 배포하고 shared/constants/services의
 * WORKER_URL · TURNSTILE_SITE_KEY를 채운 뒤에 켭니다(docs/deploy-phase2.md).
 * 켜도 그 두 값이 비어 있으면 댓글 칸을 그리지 않습니다.
 */
export const IS_COMMENTS_ENABLED = false;

/**
 * 이력서 · 포트폴리오 공개. 이력서는 아직 초안이라, 이스타가 내용을 확인한 뒤에 켭니다.
 * 꺼져 있으면 배포 빌드에 두 페이지를 만들지 않아서 머리말 메뉴, 소개 페이지 링크, 사이트맵에도 나오지 않습니다(RSS에는 글만 들어감).
 */
export const IS_RESUME_PUBLIC = false;

/**
 * 이력서 · 포트폴리오 페이지를 그릴지. 공개 전에도 개발 서버(`pnpm dev`)에서는 그려서 이스타가 미리 볼 수 있습니다.
 * `import.meta.env.DEV`는 개발 서버에서만 참이고, `astro build`에서는 거짓입니다.
 */
export const IS_RESUME_SHOWN = IS_RESUME_PUBLIC || import.meta.env.DEV;

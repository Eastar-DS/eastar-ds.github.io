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
 * 이력서 공개. 이력서를 완성한 뒤에 이스타가 켭니다(2026-11-21 결정). 포트폴리오는 이 스위치가 아니라 `IS_PORTFOLIO_SHOWN`을 따릅니다.
 * 꺼져 있으면 배포 빌드에 이력서 페이지를 만들지 않고, 머리말 메뉴, 소개와 포트폴리오의 이력서 링크와 문장, 사이트맵,
 * 공유 미리보기 그림(`/resume/og.png`), llms.txt에도 넣지 않습니다(RSS에는 글만 들어감).
 */
export const IS_RESUME_PUBLIC = false;

/**
 * 이력서 페이지와 이력서로 가는 링크를 그릴지. 공개 전에도 개발 서버(`pnpm dev`)에서는 그려서 이스타가 미리 볼 수 있습니다.
 * `import.meta.env.DEV`는 개발 서버에서만 참이고, `astro build`에서는 거짓입니다.
 */
export const IS_RESUME_SHOWN = IS_RESUME_PUBLIC || import.meta.env.DEV;

/**
 * 포트폴리오 공개. 이스타가 포트폴리오는 이력서와 따로 바로 공개하기로 정해서(2026-11-21) 늘 켜 둡니다.
 * 포트폴리오 페이지(`pages/portfolio/[...path]`), 머리말 메뉴, 소개 링크, 이력서 연락처의 포트폴리오 링크, 글 끝의 「이 글과 이어진 프로젝트」,
 * 사이트맵, 공유 미리보기 그림(`/portfolio/og.png`), llms.txt가 모두 이 값 하나를 봅니다. 끄면 이것들이 함께 빠집니다.
 * 상수 값으로 분기가 사라지지 않게 타입을 `boolean`으로 둡니다.
 */
export const IS_PORTFOLIO_SHOWN: boolean = true;

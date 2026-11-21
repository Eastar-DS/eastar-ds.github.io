/**
 * 기능 켜고 끄기. 배포를 나눠 하므로, 준비되지 않은 기능은 여기서 끕니다.
 */

/**
 * 댓글(노션 DB 익명 댓글). 2차 배포에서 Cloudflare Worker가 생기면 켭니다 (docs/plan.md 「댓글」).
 * 켜기 전에 개인정보 처리 안내(PrivacyNotice)에 닉네임 · 댓글을 노션에 저장한다고 적습니다.
 */
export const IS_COMMENTS_ENABLED = false;

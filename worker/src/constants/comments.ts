/** 댓글 받기 규칙입니다. */

/**
 * 닉네임 · 내용의 최대 글자 수(유니코드 글자 단위).
 * 블로그의 입력 칸(src/modules/widgets/post/Comments/constants/commentLimits.ts)과 같은 값이어야 합니다.
 */
export const NICKNAME_MAX_LENGTH = 20;
export const CONTENT_MAX_LENGTH = 1000;

/** Turnstile 토큰의 최대 길이 (Cloudflare 문서: 2048자) */
export const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

/** 요청 본문 최대 크기(바이트). 내용 1000자가 모두 3바이트 글자여도 넉넉한 값입니다 */
export const COMMENT_BODY_MAX_BYTES = 16 * 1024;

/** 댓글 화면을 부를 수 있는 출처. 배포 주소와 로컬 개발 주소(localhost · 127.0.0.1의 아무 포트)만 받습니다 */
export const ALLOWED_ORIGINS = ["https://eastar-ds.github.io"];
export const LOCAL_ORIGIN_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;

/** 글 주소 꼴. 글 주소(slug)는 영어 소문자 · 숫자 · 하이픈입니다 (docs/content-guide.md 2.3) */
export const POST_PATH_PATTERN = /^\/posts\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;

/** 노션 페이지 id 꼴(하이픈이 있거나 없는 32자리 16진수) */
export const NOTION_ID_PATTERN = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** 한 글의 댓글을 노션에서 읽을 때 넘기는 쪽 수의 끝(100개씩). 넘으면 앞의 것만 보입니다 */
export const COMMENT_QUERY_MAX_PAGES = 5;

/**
 * 방문자가 닉네임으로 쓸 수 없는 낱말. 띄어쓰기 · 기호 · 자모 나눠 쓰기 · 된소리 · 거센소리 · 비슷한 꼴 글자를
 * 같은 낱말로 보고 막습니다(comments/isBlockedNickname). 이스타의 답글은 노션에서 직접 쓰므로 막히지 않습니다.
 */
export const BLOCKED_NICKNAME_WORDS = ["이스타", "글쓴이", "eastar"];

/** 이스타의 답글에 닉네임이 비어 있을 때 보일 이름 */
export const AUTHOR_DISPLAY_NAME = "이스타";

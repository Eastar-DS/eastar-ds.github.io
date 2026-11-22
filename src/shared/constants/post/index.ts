/**
 * 글의 공통 규칙입니다. 정본은 docs/content-guide.md이며, 스키마와 개요 및 게시 검사가 함께 씁니다.
 * Node가 별칭 없이 읽으므로 다른 모듈을 import하지 않습니다.
 */
// 2.1, 61줄: 한글 25~32자, 40자를 넘기지 않음
export const TITLE_LENGTH = { min: 25, max: 32, limit: 40, basis: "docs/content-guide.md 2.1" } as const;
// 2.2, 72줄: 한글 60~80자, 100자를 넘기지 않음
export const DESCRIPTION_LENGTH = { min: 60, max: 80, limit: 100, basis: "docs/content-guide.md 2.2" } as const;
// 2.3, 82~83줄: 영어 소문자와 하이픈 3~5낱말, 숫자와 날짜 없음
export const SLUG = { pattern: /^[a-z]+(?:-[a-z]+)*$/, minWords: 3, maxWords: 5, basis: "docs/content-guide.md 2.3" } as const;
// 3장, 90줄: h2는 3~7개
export const H2_COUNT = { min: 3, max: 7 } as const;
// 3장, 100줄: 약 3,000~7,000자. 기존 읽는 시간 계산과는 별도로 검사함
export const POST_CHARACTERS = { min: 3000, max: 7000 } as const;
// 8.2, 259줄: 세 편 이상일 때만 시리즈
export const SERIES_MIN_POSTS = 3;
// 8.1, 254줄: 정한 분류. 새 분류는 이스타와 정해 정본에 먼저 더합니다.
export const CATEGORIES = ["브라우저", "CSS", "JavaScript", "React", "접근성", "도구"] as const;
export const CATEGORY_BASIS = "docs/content-guide.md 8.1";
// 10.3: 묻는 꼴의 h2. 꼴은 기존 글에서 쓰는 끝말을 기준으로 가릅니다.
export const QUESTION_HEADING_ENDING = /(까|나|\?)$/;

/** 기존 스키마가 쓰는 이름도 위 정의를 가리킵니다. */
export const POST_CATEGORIES = CATEGORIES;
export const POST_TITLE_MAX_LENGTH = TITLE_LENGTH.limit;
export const POST_DESCRIPTION_MAX_LENGTH = DESCRIPTION_LENGTH.limit;

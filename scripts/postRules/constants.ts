/** 정본은 docs/content-guide.md입니다. 다른 게시 검사도 이 값을 쓰도록 합칩니다. */
// 2.1, 61줄: 한글 25~32자, 40자를 넘기지 않음
export const TITLE_LENGTH = { min: 25, max: 32, limit: 40 } as const;
// 2.2, 72줄: 한글 60~80자, 100자를 넘기지 않음
export const DESCRIPTION_LENGTH = { min: 60, max: 80, limit: 100 } as const;
// 2.3, 82~83줄: 영어 소문자와 하이픈 3~5낱말, 숫자와 날짜 없음
export const SLUG = { pattern: /^[a-z]+(?:-[a-z]+)*$/, minWords: 3, maxWords: 5 } as const;
// 3장, 90줄: h2는 3~7개
export const H2_COUNT = { min: 3, max: 7 } as const;
// 3장, 100줄: 약 3,000~7,000자. 읽는 시간 5~12분과는 별도로 검사함
export const POST_CHARACTERS = { min: 3000, max: 7000 } as const;
// 8.2, 259줄: 세 편 이상일 때만 시리즈
export const SERIES_MIN_POSTS = 3;
// 8.1, 254줄: 정한 분류
export const CATEGORIES = ["브라우저", "CSS", "JavaScript", "React", "접근성", "도구"] as const;

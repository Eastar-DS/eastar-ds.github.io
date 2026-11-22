/**
 * 글 앞머리(frontmatter)가 지켜야 하는 값입니다. `src/content.config.ts`의 스키마와 게시 전 점검(`scripts/checkPost`)이 함께 씁니다.
 * 값은 정본 `docs/content-guide.md`를 따르고, 정본이 바뀌면 여기를 함께 고칩니다.
 * `astro.config.ts`처럼 별칭 없이 Node가 바로 읽는 스크립트도 불러오므로 다른 모듈을 import하지 않습니다.
 */

/**
 * 정한 분류 목록 (docs/content-guide.md 8.1).
 * 새 분류는 이스타와 정해 정본 목록에 먼저 더한 뒤 여기에 더합니다. 이름은 바꾸지 않습니다.
 */
export const POST_CATEGORIES = ["브라우저", "CSS", "JavaScript", "React", "접근성", "도구"] as const;

/** 제목의 상한 글자 수. 넘으면 빌드가 멈춥니다 (docs/content-guide.md 2.1 「40자를 넘기지 않습니다」) */
export const POST_TITLE_MAX_LENGTH = 40;

/** 요약의 상한 글자 수. 넘으면 빌드가 멈춥니다 (docs/content-guide.md 2.2 「100자를 넘기지 않습니다」) */
export const POST_DESCRIPTION_MAX_LENGTH = 100;

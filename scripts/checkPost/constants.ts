/**
 * 게시 전 점검의 기준 값입니다. 값마다 정본의 근거(파일 · 절)를 적었습니다.
 * - 정본: `docs/content-guide.md`(글쓰기 · 게시), `docs/design-system.md`(속도 예산)
 * - 빌드 스키마(`src/content.config.ts`)와 함께 쓰는 값은 `src/shared/constants/post`에서 가져와 한곳에서만 고칩니다.
 * - 정본에 값이 없는 것은 「정본에 없음」이라고 적었습니다.
 *
 * 실패와 경고를 가르는 기준
 * - 실패: 정본이 상한이나 금지로 적은 것(「넘기지 않습니다」, 「쓰지 않습니다」, 「꼭」), 독자에게 깨진 것이 보이는 것(없는 글 링크, 빠진 alt),
 *   이스타가 확인하지 않은 표시가 남은 것.
 * - 경고: 정본이 권장 범위나 알맞은 값으로 적은 것(「25~32자」, 「3~7개가 알맞습니다」), 기계 판단이 틀릴 수 있는 것(묻는 꼴 제목, 숫자 쉼표).
 */
import { OG_IMAGE } from "../../src/shared/constants/ogImage/index.ts";
import { H2_COUNT } from "../../src/shared/constants/post/index.ts";
export { TITLE_LENGTH, DESCRIPTION_LENGTH, SLUG, CATEGORIES, CATEGORY_BASIS, QUESTION_HEADING_ENDING } from "../../src/shared/constants/post/index.ts";

const CONTENT_GUIDE = "docs/content-guide.md";
const DESIGN_SYSTEM = "docs/design-system.md";

/** 글 구조 (content-guide 3장) */
export const STRUCTURE = {
  /** 본문 제목은 h2 · h3까지만. 더 깊으면 실패 */
  maxHeadingDepth: 3,
  /** h2 개수 「3~7개가 알맞습니다」. 밖이면 경고 */
  minH2: H2_COUNT.min,
  maxH2: H2_COUNT.max,
  /** 끝 절의 제목 「끝에 「정리」 절을 두고」. 없거나 끝이 아니면 실패 */
  summaryHeading: "정리",
  /** 「정리」 뒤에 와도 되는 절. 9장 「글 끝 「고친 내용」에 날짜와 한 줄을 남깁니다」 */
  afterSummaryHeadings: ["고친 내용"] as readonly string[],
  /** 「정리」의 목록 항목 「핵심 3~5개를 목록으로」. 밖이면 경고 */
  minSummaryItems: 3,
  maxSummaryItems: 5,
  /** 읽는 시간 「5~12분(한글 약 3,000~7,000자)을 기준으로」. 밖이면 경고. 분은 `shared/content/calculateReadingMinutes`(1분에 500자)로 셉니다 */
  minReadingMinutes: 5,
  maxReadingMinutes: 12,
  basis: `${CONTENT_GUIDE} 3장`,
} as const;

/** 코드 칸 (content-guide 5장) */
export const CODE = {
  /** 「한 줄은 60자 이하로 씁니다」. 넘으면 실패 */
  maxLineLength: 60,
  /** 「한 칸은 25줄 이하로 씁니다」. 넘으면 실패 */
  maxLines: 25,
  /** 「한 칸에 세 줄 이하로만」(강조 줄). 넘으면 실패 */
  maxHighlightedLines: 3,
  /** 「셸 명령에는 `$` 프롬프트를 붙이지 않습니다」를 볼 언어. 정본은 셸 언어 이름을 적지 않아 흔한 이름을 골랐습니다 */
  shellLanguages: ["bash", "sh", "shell", "zsh", "console"],
  basis: `${CONTENT_GUIDE} 5장`,
} as const;

/** 한글 표기 (content-guide 4장) */
export const NOTATION = {
  /**
   * 「큰 수는 세 자리마다 쉼표를 찍습니다」를 볼 세는 말. 연도(2026년), PR 번호, 크기(1200×630)는 쉼표를 찍지 않으므로
   * 정본에 없는 기준으로 「네 자리 이상 숫자 + 아래 세는 말」만 봅니다. 기계 판단이라 경고
   */
  counterWords: ["개", "자", "명", "번", "건", "줄", "편", "행", "회", "원"],
  basis: `${CONTENT_GUIDE} 4장`,
} as const;

/** content-guide 4.1: 수의 범위는 짧은 줄표(U+2013)로 쓰며, 물결표는 하나라도 실패입니다. */
export const RANGE_TILDE = {
  basis: `${CONTENT_GUIDE} 4.1`,
} as const;

/** 그림 (content-guide 6.1, 표 설명은 3장) */
export const FIGURE = {
  /** 「그림 설명은 「그림 1.」로 시작」, 표는 「표 1.」로 시작. 다르면 실패 */
  captionPattern: /^(그림|표) (\d+)\. /,
  /** alt가 이 말로 시작하면 실패 「「스크린샷」, 「그림」 같은 말로 시작하지 않습니다」. 「이미지」, 「사진」, 「캡처」는 「같은 말」로 더했습니다 */
  bannedAltPrefixes: ["스크린샷", "그림", "이미지", "사진", "캡처"],
  basis: `${CONTENT_GUIDE} 6.1`,
} as const;

/**
 * 이스타가 확인할 곳 표시. 정본에 없는 관례로, 모델이 지어 채우면 안 되는 생각이나 배운 점 자리에 `〔이스타 확인: …〕`로 둡니다.
 * 초안이 아닌 글에 남아 있으면 실패, 초안이면 경고입니다(content-guide 12장 「게시는 늘 이스타가 확인한 뒤에 합니다」).
 */
export const REVIEW_MARKER = /〔이스타 확인[^〕\n]*〕?/g;
export const REVIEW_MARKER_BASIS = `${CONTENT_GUIDE} 12장`;

/** 갈 곳을 말하지 않는 링크 글 (content-guide 10.5 「링크 글이 갈 곳을 말한다(「여기」 없음)」). 링크 글 전체가 이 말이면 실패 */
export const VAGUE_LINK_TEXTS = ["여기", "이곳", "이 글", "링크", "클릭", "바로가기", "여기를 누르세요"];

/** 글 주소 꼴. 이 블로그의 다른 글로 가는 링크를 고릅니다 */
export const POST_LINK_PATTERN = /^\/posts\/([^/#?]+)\/?(?:#(.*))?$/;

/** 빌드 결과 검사 (content-guide 10.6, 6.2, design-system 10장) */
export const DIST = {
  /** `<title>`은 「글 제목 · 사이트 이름」 (content-guide 2.1) */
  titleSeparator: " · ",
  ogImage: {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    /** 6.2 「300KB 이하」. `shared/constants/ogImage`와 같은 값 */
    maxBytes: OG_IMAGE.maxBytes,
  },
  /** design-system 10장 「속도 예산」. 모두 gzip 크기이고 1KB는 1,024바이트로 셉니다 */
  js: {
    /** 데모 없는 글: 「작은 스크립트 합계 5KB 이하」, 「프레임워크 JS 0KB」 */
    withoutDemoBytes: 5 * 1024,
    /** 데모 있는 글: 「페이지 합계 100KB 이하(React 런타임 포함)」 */
    withDemoBytes: 100 * 1024,
    /** 「데모 하나의 자체 코드는 30KB 이하」. 렌더러(React)가 함께 부르는 파일은 빼고 셉니다 */
    demoOwnBytes: 30 * 1024,
  },
  basis: `${CONTENT_GUIDE} 10.6`,
  jsBasis: `${DESIGN_SYSTEM} 10장`,
  ogImageBasis: `${CONTENT_GUIDE} 6.2`,
} as const;

/**
 * 검사마다 docs/content-guide.md에서 맡는 절. 10장 확인 목록에 있으면 10장의 절이고, 10장에 없는 검사(코드 칸, 표기)는 규칙이 있는 장입니다.
 * prepublish-check 스킬이 보고 표의 「항목(10장)」 칸에 씁니다.
 */
export const CHECK_SECTIONS: Record<string, string> = {
  frontmatter: "1장",
  "title-length": "10.1",
  "description-length": "10.1",
  "description-repeats-title": "10.1",
  "slug-format": "10.1",
  "slug-words": "10.1",
  category: "10.1",
  dates: "9장",
  h1: "10.2",
  "heading-depth": "10.2",
  "h2-count": "3장",
  "summary-section": "10.2",
  "summary-items": "3장",
  "question-heading": "10.3",
  "reading-time": "3장",
  "code-fence": "5장",
  "code-language": "5장",
  "code-line-length": "5장",
  "code-block-lines": "5장",
  "code-highlight": "5장",
  "code-shell-prompt": "5장",
  "code-indent": "5장",
  br: "4장",
  emoji: "4장",
  exclamation: "4장",
  "double-quote": "4장",
  italic: "4장",
  "bold-per-paragraph": "4장",
  "hard-line-break": "4장",
  "number-comma": "4장",
  "multiple-tildes": "4.1",
  "image-alt": "10.4",
  "image-alt-empty": "10.4",
  "figure-caption": "10.4",
  "figure-numbering": "6.1",
  "review-marker": "12장",
  "internal-links": "10.5",
  "internal-link-slash": "10.5",
  "draft-links": "10.5",
  "link-text": "10.5",
  "external-source": "10.3",
  "series-order": "8.2",
  "private-info": "11장",
  "writing-style": "머리말",
  "dist-fact-check": "10.3",
  "dist-page": "10.6",
  "dist-meta": "10.6",
  "dist-og": "10.6",
  "dist-og-image": "10.4",
  "dist-blogposting": "10.6",
  "dist-breadcrumb": "10.6",
  "dist-h1": "10.2",
  "dist-links": "10.5",
  "dist-feeds": "10.6",
  "dist-js": "10.6",
  "dist-draft-excluded": "12장",
};

export { CONTENT_GUIDE, DESIGN_SYSTEM };
